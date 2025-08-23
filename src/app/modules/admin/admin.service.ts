import { TutorRequest, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

interface GetAllUsersQuery {
  role?: UserRole;       // STUDENT / TUTOR
  searchTerm?: string;
  page?: string;       // page number
  limit?: string;      // page size
  sort?: string;
  subject?: string      // e.g., "-createdAt"
}

const getAllUsers = async (query: GetAllUsersQuery) => {
  const { role, subject, searchTerm, page = "1", limit = "10", sort = "-createdAt" } = query;

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Sorting
  const orderBy = sort.startsWith("-")
    ? { [sort.substring(1)]: "desc" }
    : { [sort]: "asc" };

  // WHERE condition
  const where: any = {
    NOT: { role: UserRole.ADMIN, isTutorApproved: false }, // always exclude admin
  };

  if (role) {
    where.role = role;
  }

  if (subject && role === UserRole.TUTOR) {
    where.subject = {
      has: subject, // subject array er moddhe check korbe
    };
  }

  if (searchTerm) {
    where.OR = [
      { fullName: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Fetch data
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        fullName: true,
        email: true,
        isTutorApproved: true,
        isTutorRequest: true,
        tutorRequestStatus: true,
        role: true,
        subject: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getTutorRequest = async ({ adminId }: { adminId: string }) => {

  const admin = await prisma.user.findUnique({
    where: { id: adminId, role: UserRole.ADMIN },
  });
  if (!admin) {
    throw new Error("Admin not found!");
  }

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized  request!");
  }


  const result = await prisma.user.findMany({
    where: { isTutorApproved: false, isTutorRequest: true, role: UserRole.TUTOR },
    select: {
      id: true,
      fullName: true,
      experience: true,
      isTutorApproved: true,
      isTutorRequest: true,
      tutorRequestStatus: true,
      email: true,
      role: true,
      subject: true,
      createdAt: true,
    }
  });
  return result;
};


// get tutor request by id
const getTutorRequestById = async ({ tutorId, adminId }: { tutorId: string, adminId: string }) => {

  if (!tutorId) {
    throw new Error("User tutor id  is required");
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId, role: UserRole.ADMIN },
  });
  if (!admin) {
    throw new Error("Admin not found!");
  }

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized  request!");
  }


  const result = await prisma.user.findUnique({
    where: { id: tutorId }
  });
  return result;


};


const updateTutorRequestStatus = async ({ tutorId, adminId, status }: { tutorId: string, adminId: string, status: TutorRequest }) => {

  const admin = await prisma.user.findUnique({
    where: { id: adminId, role: UserRole.ADMIN },
  });
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found!");
  }

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized  request!");
  }

  if (status !== TutorRequest.ACCEPTED && status !== TutorRequest.CANCELLED) {
    throw new ApiError(httpStatus.BAD_REQUEST, " Status must be either 'ACCEPTED' or 'CANCELLED'!");
  }


  const result = await prisma.user.update({
    where: { id: tutorId },
    data: {
      isTutorRequest: false,
      isTutorApproved: status === TutorRequest.ACCEPTED ? true : false,
      tutorRequestStatus: status
    },
    select: {
      id: true,
      fullName: true,
      experience: true,
      isTutorApproved: true,
      isTutorRequest: true,
      tutorRequestStatus: true,
      email: true,
      role: true,
      subject: true,
      createdAt: true,
    }
  });
  return result;
};

// get stats
const getStatsService = async () => {

  // Step 1: Prepare last 7 days dates (aj soho)

  const dateArray: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    // Force YYYY-MM-DD in local timezone
    const dateStr = d.toLocaleDateString("en-CA"); // en-CA => YYYY-MM-DD
    dateArray.push(dateStr);
  }


  // Step 2: Count total users (excluding admins and non-approved tutors)

  const userCount = await prisma.user.count({
    where: {
      NOT: { role: UserRole.ADMIN, isTutorApproved: false },
    },
  });


  // Step 3: Count total tutors

  const tutorCount = await prisma.user.count({
    where: { role: UserRole.TUTOR },
  });


  // Step 4: Count total students

  const studentCount = await prisma.user.count({
    where: { role: UserRole.STUDENT },
  });


  // Step 5: Get date 7 days ago

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 din age (aj soho total 7 din)


  // Step 6: Count new users in last 7 days

  const newUserCount = await prisma.user.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });


  // Step 7: Aggregate payments from last 7 days

  const paymentsByDay = await prisma.payment.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    _sum: { amountPaid: true },
  });

  // Map to YYYY-MM-DD string
  const LastSevenDays = dateArray.map(date => {
    const found = paymentsByDay.find(
      d => new Date(d.createdAt).toLocaleDateString("en-CA") === date
    );
    return { date, amountPaid: found?._sum.amountPaid ?? 0 };
  });


  // Step 9: Return final stats

  return {
    totalUser: userCount,
    totalTutors: tutorCount,
    totalStudents: studentCount,
    newUser: newUserCount,
    lastSavedDay: LastSevenDays || [],
  };
};


// get warning tutors
const getWarningTutorsService = async () => {

  const lowRatingUsers = await prisma.user.findMany({
    where: {
      tutorReview: {
        some: { rating: 1 }
      }
    },
    include: {
      tutorReview: {
        where: { rating: 1 }
      }
    }
  });



  // const result = await prisma.user.findMany({
  //   where: { rating:  {gt: 0, lte: 1 } },
  //   select: {
  //     id: true,
  //     fullName: true,
  //     experience: true,
  //     isTutorApproved: true,
  //     isTutorRequest: true,
  //     tutorRequestStatus: true,
  //     rating: true,
  //     email: true,
  //     role: true,
  //     subject: true,
  //     createdAt: true,
  //   }
  // });
  return lowRatingUsers;
};

// get warning tutors
// const getWalletService = async () => {



//   const result = await prisma.payment.findMany({
//     select: {
//       id: true,
//       amountPaid: true,
//       // createdAt: true,
//       tutorID: true,
//       studentID: true,
//     }
//   });

//   const total = await prisma.payment.aggregate({
//     _sum: {
//       amountPaid: true,
//     }
//   });



//   return {result, total};
// }

// get warning tutors
const warnTutorService = async ({ userId, adminId, message }: { userId: string, message: string, adminId: string }) => {

  if (!adminId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "unauthorized request!");
  }

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User id is required!");
  }
  if (!message) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Message is required!");
  }



  const result = await prisma.warning.create({
    data: {
      userId: userId,
      message,
      adminId
    }
  })

  return result
}

// get warning tutors
const suspendTutorService = async ({ userId, adminId }: { userId: string, adminId: string }) => {

  if (!adminId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "unauthorized request!");
  }

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User id is required!");
  }
}


export const adminService = {
  getAllUsers,
  getTutorRequest,
  getTutorRequestById,
  updateTutorRequestStatus,
  getStatsService,
  getWarningTutorsService,
  // getWalletService,
  warnTutorService,
  suspendTutorService
};