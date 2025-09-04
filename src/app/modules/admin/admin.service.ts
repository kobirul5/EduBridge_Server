import { TutorRequest, UserRole, UserStatus } from "@prisma/client";
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


  where.status = {
    not: UserStatus.SUSPENDED
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
        isOnline: true,
        role: true,
        subject: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
    data,
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
      profileImage: true,
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
  // Step 1: Prepare last 7 days dates (YYYY-MM-DD)
  const dateArray7: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-CA");
    dateArray7.push(dateStr);
  }

  // Step 2: Prepare last 30 days dates (YYYY-MM-DD)
  const dateArray30: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-CA");
    dateArray30.push(dateStr);
  }

  // Step 3: Count total users (excluding admins and non-approved tutors)
  const userCount = await prisma.user.count({
    where: {
      NOT: { role: UserRole.ADMIN, isTutorApproved: false },
    },
  });

  // Step 4: Count total tutors
  const tutorCount = await prisma.user.count({
    where: { role: UserRole.TUTOR },
  });

  // Step 5: Count total students
  const studentCount = await prisma.user.count({
    where: { role: UserRole.STUDENT },
  });

  // Step 6: Date boundaries
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  // Step 7: Count new users in last 7 days
  const newUserCount7 = await prisma.user.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

  // Step 8: Count new users in last 30 days
  const newUserCount30 = await prisma.user.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // Step 9: Payments last 7 days (group by day)
  const paymentsByDay7 = await prisma.payment.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: sevenDaysAgo } },
    _sum: { amountPaid: true },
  });

  const LastSevenDays = dateArray7.map(date => {
    const found = paymentsByDay7.find(
      d => new Date(d.createdAt).toLocaleDateString("en-CA") === date
    );
    return { date, amountPaid: found?._sum.amountPaid ?? 0 };
  });

  // Step 10: Payments last 30 days (group by day)
  const paymentsByDay30 = await prisma.payment.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _sum: { amountPaid: true },
  });

  const LastThirtyDays = dateArray30.map(date => {
    const found = paymentsByDay30.find(
      d => new Date(d.createdAt).toLocaleDateString("en-CA") === date
    );
    return { date, amountPaid: found?._sum.amountPaid ?? 0 };
  });

  // Step 11: Return final stats
  return {
    totalUser: userCount,
    totalTutors: tutorCount,
    totalStudents: studentCount,
    newUser7: newUserCount7,
    newUser30: newUserCount30,
    last7Days: LastSevenDays || [],
    last30Days: LastThirtyDays || [],
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



//   return {total: total._sum.amountPaid, result};
// }

const getWalletService = async () => {
  const now = new Date();

  // ===== This Week Range =====
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay()); 
  startOfThisWeek.setHours(0, 0, 0, 0);

  // ===== Total Income =====
  const total = await prisma.payment.aggregate({
    _sum: { amountPaid: true }
  });

  // ===== Last Week Income =====
  const lastWeekTotal = await prisma.payment.aggregate({
    _sum: { amountPaid: true },
    where: {
      createdAt: { lt: startOfThisWeek } 
    }
  });

  const totalAmount = total._sum.amountPaid ?? 0;
  const lastWeekAmount = lastWeekTotal._sum.amountPaid ?? 0;
  const lastWeekPercentage = totalAmount > 0 ? (lastWeekAmount / totalAmount) * 100 : 0;


  // =====  =====
  const thisWeekAmount = totalAmount - lastWeekAmount;

  // ===== =====
  let percentageChange = 0;
  if (lastWeekAmount > 0) {
    percentageChange = (thisWeekAmount / lastWeekAmount) * 100;
  }

    const result = await prisma.payment.findMany({
    select: {
      id: true,
      amountPaid: true,
      // createdAt: true,
      studentID: true,
      student:{
        select: {
          fullName: true,
          profileImage: true,
          email: true
        }
      }
    }
  });

  return {
    total: totalAmount,
    lastWeek: lastWeekAmount,
    thisWeek: thisWeekAmount,
    percentageChange: lastWeekPercentage.toFixed(2),
    user: result
  };
};


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
const suspendTutorService = async ({ tutorId, adminId }: { tutorId: string, adminId: string }) => {

  if (!adminId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "unauthorized request!");
  }

  if (!tutorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User id is required!");
  }

  const tutor = await prisma.user.findUnique({
    where: { id: tutorId, role: UserRole.TUTOR },
  });
  if (!tutor) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tutor not found!");
  }

  if (tutor.status === UserStatus.SUSPENDED) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Tutor is already suspended!");
  }


  const result = await prisma.user.update({
    where: { id: tutorId },
    data: {
      status: UserStatus.SUSPENDED,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      subject: true,
      profileImage: true,
      about: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return result
}


export const adminService = {
  getAllUsers,
  getTutorRequest,
  getTutorRequestById,
  updateTutorRequestStatus,
  getStatsService,
  getWarningTutorsService,
  getWalletService,
  warnTutorService,
  suspendTutorService
};