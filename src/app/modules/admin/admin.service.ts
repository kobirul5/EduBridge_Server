import {
  NotificationType,
  TutorRequest,
  UserRole,
  UserStatus,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { notificationService } from "../Notification/Notification.service";
import { isProfileComplete } from "../User/user.services";

interface GetAllUsersQuery {
  role?: UserRole; // STUDENT / TUTOR
  searchTerm?: string;
  page?: string; // page number
  limit?: string; // page size
  sort?: string;
  subject?: string; // e.g., "-createdAt"
}

const getAllUsers = async (query: GetAllUsersQuery) => {
  const {
    role,
    subject,
    searchTerm,
    page = "1",
    limit = "10",
    sort = "-createdAt",
  } = query;

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
    not: UserStatus.SUSPENDED,
  };

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
    where: {
      isTutorApproved: false,
      isTutorRequest: true,
      role: UserRole.TUTOR,
    },
    select: {
       id: true,
      fullName: true,
      phoneNumber: true,
      gender: true,
      city: true,
      education: true,
      about: true,
      hourlyRate: true,
      experience: true,
      subject: true,
      availableDays: true,
      availableTime: true,
      isTutorApproved: true,
      isTutorRequest: true,
      tutorRequestStatus: true,
      profileImage: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

 const filteredUsers = result.filter(user => isProfileComplete(user));

  return filteredUsers;
};

// get tutor request by id
const getTutorRequestById = async ({
  tutorId,
  adminId,
}: {
  tutorId: string;
  adminId: string;
}) => {
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
    where: { id: tutorId },
  });
  return result;
};

const updateTutorRequestStatus = async ({
  tutorId,
  adminId,
  status,
}: {
  tutorId: string;
  adminId: string;
  status: TutorRequest;
}) => {
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
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      " Status must be either 'ACCEPTED' or 'CANCELLED'!"
    );
  }

  const result = await prisma.user.update({
    where: { id: tutorId },
    data: {
      isTutorRequest: false,
      isTutorApproved: status === TutorRequest.ACCEPTED ? true : false,
      tutorRequestStatus: status,
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
    },
  });

  // Send notification to the tutor
  await prisma.notification.create({
    data: {
      userId: tutorId,
      title: `Your tutor request has been ${status.toLowerCase()}`,
      body: `Admin has ${status.toLowerCase()} your tutor request.`,
      type: NotificationType.GENERAL,
    },
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

  const LastSevenDays = dateArray7.map((date) => {
    const found = paymentsByDay7.find(
      (d) => new Date(d.createdAt).toLocaleDateString("en-CA") === date
    );
    return { date, amountPaid: found?._sum.amountPaid ?? 0 };
  });

  // Step 10: Payments last 30 days (group by day)
  const paymentsByDay30 = await prisma.payment.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _sum: { amountPaid: true },
  });

  const LastThirtyDays = dateArray30.map((date) => {
    const found = paymentsByDay30.find(
      (d) => new Date(d.createdAt).toLocaleDateString("en-CA") === date
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
  const allUsers = await prisma.user.findMany({
    where: {
      role: UserRole.TUTOR,
      status: UserStatus.SUSPENDED,
    },
  });

  const lowRatingUsers = await prisma.user.findMany({
    where: {
      tutorReview: {
        some: { rating: 1 },
      },
      status: {
        not: UserStatus.SUSPENDED,
      },
    },
    select: {
      // explicitly choose fields for the main user
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      createdAt: true,
      role: true,
      status: true,
      tutorReview: {
        where: { rating: 1 },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
              // role: true
            },
          },
        },
      },
    },
  });

  return lowRatingUsers;
};


const getWalletService = async () => {
  const now = new Date();

  // ===== This Week Range =====
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  // ===== Total Income =====
  const total = await prisma.payment.aggregate({
    _sum: { amountPaid: true },
  });

  // ===== Last Week Income =====
  const lastWeekTotal = await prisma.payment.aggregate({
    _sum: { amountPaid: true },
    where: {
      createdAt: { lt: startOfThisWeek },
    },
  });

  const totalAmount = total._sum.amountPaid ?? 0;
  const lastWeekAmount = lastWeekTotal._sum.amountPaid ?? 0;
  const lastWeekPercentage =
    totalAmount > 0 ? (lastWeekAmount / totalAmount) * 100 : 0;

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
      student: {
        select: {
          fullName: true,
          profileImage: true,
          email: true,
        },
      },
    },
  });

  return {
    total: totalAmount,
    lastWeek: lastWeekAmount,
    thisWeek: thisWeekAmount,
    percentageChange: lastWeekPercentage.toFixed(2),
    user: result,
  };
};

// get warning tutors
// const warnTutorService = async ({
//   userId,
//   adminId,
//   message,
// }: {
//   userId: string;
//   message: string;
//   adminId: string;
// }) => {
//   if (!adminId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "unauthorized request!");
//   }

//   if (!userId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User id is required!");
//   }
//   if (!message) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Message is required!");
//   }

//   const result = await prisma.warning.create({
//     data: {
//       userId: userId,
//       message,
//       adminId,
//     },
//   });

//   const notificationPayload = {
//     userId: userId,
//     message: message,
//     adminId,
//   };

//   return result;
// };

const warnTutorService = async ({
  userId,
  adminId,
  message,
}: {
  userId: string;
  message: string;
  adminId: string;
}) => {
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
      adminId,
    },
  });

  // ✅ Tutor 
  const tutor = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, fcmToken: true },
  });

  if (tutor) {
    const notificationPayload = {
      title: "You Have Received a Warning",
      body: message,
      type: NotificationType.REMINDER,
      data: JSON.stringify({
        tutorId: tutor.id,
        warningId: result.id,
      }),
      targetId: tutor.id,
      slug: "tutor-warning",
    };

    //  Push notification 
    if (tutor.fcmToken) {
      await notificationService.sendNotification(tutor.fcmToken as string, notificationPayload, tutor.id);
    }

    //  Database এ notification save
    await notificationService.saveNotification(notificationPayload, tutor.id);
  }

  return result;
};


// get warning tutors
const suspendTutorService = async ({
  tutorId,
  adminId,
}: {
  tutorId: string;
  adminId: string;
}) => {
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
      updatedAt: true,
      fcmToken: true, //  notification
    },
  });

  //  Notification
  const notificationPayload = {
    title: "Your Account Has Been Suspended",
    body: `Hello ${result.fullName}, your tutor account has been suspended by the admin due to policy violations or poor performance.`,
    type: NotificationType.REMINDER,
    data: JSON.stringify({
      tutorId: result.id,
      status: result.status,
    }),
    targetId: result.id,
    slug: "tutor-suspended",
  };

  //  Push notification পাঠানো (যদি fcmToken থাকে)
  if (result.fcmToken) {
    await notificationService.sendNotification(
      tutor?.fcmToken as string,
      notificationPayload,
      result.id
    );
  }

  //  Database এ notification save
  await notificationService.saveNotification(notificationPayload, result.id);

  return result;
};

export const adminService = {
  getAllUsers,
  getTutorRequest,
  getTutorRequestById,
  updateTutorRequestStatus,
  getStatsService,
  getWarningTutorsService,
  getWalletService,
  warnTutorService,
  suspendTutorService,
};
