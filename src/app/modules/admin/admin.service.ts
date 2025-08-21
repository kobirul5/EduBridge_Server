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
  const tutorID = "6891301c439cc9b1ff04b027";

  // Last 7 days
  const dateArray: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d) {
      dateArray.push(d.toISOString().split("T")[0]);
    }
  }

  const userCount = await prisma.user.count({
    where: {
      NOT: { role: UserRole.ADMIN, isTutorApproved: false },
    },
  });

  const tutorCount = await prisma.user.count({ where: { role: UserRole.TUTOR } });
  const studentCount = await prisma.user.count({ where: { role: UserRole.STUDENT } });

  const sevenDaysAgo = new Date();
  if (sevenDaysAgo) {
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  }

  const newUserCount = await prisma.user.count({
    where: { createdAt: { gte: sevenDaysAgo ?? new Date() } },
  });

  const LastSevenDaysRaw = await prisma.payment.aggregateRaw({
    pipeline: [
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo ?? new Date() },
          tutorID,
        },
      },
      { $addFields: { createdAtDate: { $toDate: "$createdAt" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAtDate" } },
          totalAmount: { $sum: "$amountPaid" },
        },
      },
      { $sort: { "_id": 1 } },
    ],
  });

  if(!LastSevenDaysRaw){
    return {
      totalUser: userCount,
      totalTutors: tutorCount,
      totalStudents: studentCount,
      newUser: newUserCount,
      lastSavedDay: [],
    };
  }

  const LastSevenDays = dateArray.map(date => {
    const found = (LastSevenDaysRaw as any).find( (d: any) => d._id === date);
    return { date, totalAmount: found?.totalAmount ?? 0 };
  });

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


export const adminService = {
  getAllUsers,
  getTutorRequest,
  getTutorRequestById,
  updateTutorRequestStatus,
  getStatsService,
  getWarningTutorsService
};