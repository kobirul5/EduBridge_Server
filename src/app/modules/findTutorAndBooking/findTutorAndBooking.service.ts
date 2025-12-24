import {
  BookingStatus,
  NotificationType,
  PaymentStatus,
  UserRole,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { get } from "http";
import { notificationService } from "../Notification/Notification.service";

// TODO: Create a service to handle features related to finding tutors and booking sessions

const getAllTurorsService = async () => {
  const tutors = await prisma.user.findMany({
    where: { role: UserRole.TUTOR, isTutorApproved: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      hourlyRate: true,
      subject: true,
      rating: true,
      role: true,
      studentReviewes: true,
      profileImage: true,
      education: true,
      experience: true,
      about: true,
      createdAt: true,
    },
  });

  if (!tutors || tutors.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No tutors found");
  }
  return tutors;
};

const getTutorByIdService = async (id: string) => {


  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      hourlyRate: true,
      subject: true,
      rating: true,
      studentReviewes: true,
      demoClassUrl: true,
      role: true,
      profileImage: true,
      education: true,
      availableDays: true,
      availableTime: true,
      experience: true,
      about: true,
      city: true,
      createdAt: true,
      tutorReview: {
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  if (!user || user.role !== UserRole.TUTOR) {
    throw new ApiError(httpStatus.NOT_FOUND, "No tutor found");
  }

  return user;
};

const createBookingService = async (
  tutorId: string,
  studentId: string,
  date: Date,
  subject: string,
  startTime: Date,
  endTime: Date,
  totalAmount: number
) => {
  if (!tutorId || !date || !subject || !startTime || !endTime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Tutor ID, date and time are required"
    );
  }
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Expire token or invalid token");
  }

  const tutor = await prisma.user.findUnique({ where: { id: tutorId } });
  if (!tutor || tutor.role !== UserRole.TUTOR) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tutor not found");
  }

  const booking = await prisma.booking.create({
    data: {
      tutorId: tutorId,
      studentId: studentId,
      date: date,
      subject: subject,
      startTime: startTime,
      endTime: endTime,
      totalAmount: totalAmount,
    },
    // include: {
    //   tutor: true
    // }
  });

  if (!booking) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create booking"
    );
  }

  // Send notification to teacher about new booking request
  if (booking.tutorId && tutor?.fcmToken) {
    await notificationService.sendNotification(
      tutor.fcmToken,
      {
        title: "You Have a New Booking Request From a Student",
        body: `You Have a new booking request from a student for subject ${booking.subject} on ${booking.date}. Please check your bookings to confirm or reject the request.`,
        type: NotificationType.BOOKING,
        data: JSON.stringify({
          tutorId: booking.tutorId,
          subject: booking.subject,
        }),
        targetId: tutorId,
        slug: "new-booking-request",
      },
      tutor.id
    );
  }
  if (booking.tutorId) {
    await notificationService.saveNotification(
      {
        title: "You Have a New Booking Request From a Student",
        body: `You Have a new booking request from a student for subject ${booking.subject} on ${booking.date}. Please check your bookings to confirm or reject the request.`,
        type: NotificationType.BOOKING,
        data: JSON.stringify({
          tutorId: booking.tutorId,
          subject: booking.subject,
        }),
        targetId: tutorId,
        slug: "new-booking-request",
      },
      tutor.id
    );
  }
  return booking;
};
// get daily schedule and booking for a student
const getDailyScheduleAndBookingService = async (studentId: string) => {
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Expire token or invalid token");
  }

  const bookings = await prisma.booking.findMany({
    where: {
      studentId: studentId,
      // NOT: { bookingsStatus: BookingStatus.CANCELLED },
    },
    include: {
      tutor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          about: true,
          subject: true,
          rating: true,
          experience: true,
          hourlyRate: true,
        },
      },
      // Payment:true
    },
  });

  // if (!bookings || bookings.length === 0) {
  //   throw new ApiError(httpStatus.NOT_FOUND, "No bookings found");
  // }
  return bookings;
};

// get booking request for a tutor
const getBookingRequestService = async (tutorId: string) => {
  if (!tutorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Expire token or invalid token");
  }

  console.log("tutorId", tutorId);

  const bookingRequests = await prisma.booking.findMany({
    where: { tutorId: tutorId, bookingsStatus: BookingStatus.PENDING },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  return bookingRequests;
};

// accept or reject booking request

// const acceptOrRejectBookingRequestService = async (
//   bookingId: string,
//   bookingsStatus: BookingStatus,
//   userId: string
// ) => {

//   const user = await prisma.user.findUnique({ where: { id: userId } });

//   if(!user) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Expire token or invalid token");
//   }



//   if (!bookingId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Booking ID is required");
//   }
//   const allowedStatuses: BookingStatus[] = [
//     BookingStatus.CONFIRMED,
//     BookingStatus.CANCELLED,
//   ];

//   if (!allowedStatuses.includes(bookingsStatus)) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Invalid booking status. Must be either 'CONFIRMED' or 'CANCELLED'"
//     );
//   }

//   if (bookingsStatus !== "CONFIRMED") {
//     const booking = await prisma.booking.update({
//       where: { id: bookingId },
//       data: { bookingsStatus: bookingsStatus },
//     });

//     if (!booking) {
//       throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
//     }
//     return booking;
//   }

//   const booking = await prisma.booking.update({
//     where: { id: bookingId },
//     data: { bookingsStatus: bookingsStatus },
//   });
//   if (!booking) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
//   }

//   const student = await prisma.user.findUnique({
//     where: { id: booking.studentId },
//   });

//   if (!student) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
//   }

//   // Send notification to courier about cash payment
//   if (booking.studentId && student?.fcmToken) {
//     await notificationService.sendNotification(
//       student.fcmToken,
//       {
//         title: "Your Booking Request Has Been Updated By Tutor",
//         body: `Your booking request for subject ${booking.subject} on ${
//           booking.date
//         } has been ${bookingsStatus.toLowerCase()} by the tutor. Please check your bookings for more details.`,
//         type: NotificationType.BOOKING,
//         data: JSON.stringify({
//           tutorId: booking.tutorId,
//           subject: booking.subject,
//         }),
//         targetId: student.id,
//         slug: "booking-request-updated",
//       },
//       student.id
//     );
//   }
//   if (booking.studentId) {
//     await notificationService.saveNotification(
//       {
//         title: "Your Booking Request Has Been Updated By Tutor",
//         body: `Your booking request for subject ${booking.subject} on ${
//           booking.date
//         } has been ${bookingsStatus.toLowerCase()} by the tutor. Please check your bookings for more details.`,
//         type: NotificationType.BOOKING,
//         data: JSON.stringify({
//           tutorId: booking.tutorId,
//           subject: booking.subject,
//         }),
//         targetId: student.id,
//         slug: "booking-request-updated",
//       },
//       student.id
//     );
//   }
//   return booking;
// };

const acceptOrRejectBookingRequestService = async (
  bookingId: string,
  bookingsStatus: BookingStatus,
  userId: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
  }

  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Booking ID is required");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // 🔒 Payment successful → no cancel allowed
  if (
    bookingsStatus === BookingStatus.CANCELLED &&
    booking.paymentStatus === "COMPLETED"
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Booking cannot be cancelled after payment is completed"
    );
  }

  // 👤 Role based permission
  if (user.role === "STUDENT" && booking.studentId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized action");
  }

  if (user.role === "TUTOR" && booking.tutorId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized action");
  }

  // ✅ Update booking status
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingsStatus },
  });

  // ---------------- Notifications ----------------

  let receiverId: string;
  let title: string;
  let body: string;

  if (bookingsStatus === BookingStatus.CANCELLED) {
    if (user.role === "STUDENT") {
      receiverId = booking.tutorId;
      title = "Booking Cancelled by Student";
      body = `The student has cancelled the booking for ${booking.subject} scheduled on ${booking.date}.`;
    } else {
      receiverId = booking.studentId;
      title = "Booking Cancelled by Tutor";
      body = `The tutor has cancelled your booking for ${booking.subject} scheduled on ${booking.date}.`;
    }
  } else {
    receiverId = booking.studentId;
    title = "Booking Confirmed";
    body = `Your booking for ${booking.subject} on ${booking.date} has been confirmed by the tutor.`;
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (receiver?.fcmToken) {
    await notificationService.sendNotification(
      receiver.fcmToken,
      {
        title,
        body,
        type: NotificationType.BOOKING,
        data: JSON.stringify({
          bookingId: booking.id,
          subject: booking.subject,
        }),
        targetId: receiverId,
        slug: "booking-status-updated",
      },
      receiverId
    );
  }

  await notificationService.saveNotification(
    {
      title,
      body,
      type: NotificationType.BOOKING,
      data: JSON.stringify({
        bookingId: booking.id,
        subject: booking.subject,
      }),
      targetId: receiverId,
      slug: "booking-status-updated",
    },
    receiverId
  );

  return updatedBooking;
};


// get accepted booking for a tutor
const getBookingRequestForTutorService = async (tutorId: string) => {
  if (!tutorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Expire token or invalid token");
  }

  const acceptedBookings = await prisma.booking.findMany({
    where: {
      tutorId: tutorId,
      bookingsStatus: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.COMPLETED,
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  const uniqueDates = await prisma.booking.groupBy({
    where: {
      tutorId: tutorId,
      bookingsStatus: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.COMPLETED,
    },
    by: ["startTime"],
    orderBy: { startTime: "asc" },
  });

  return { uniqueDates, acceptedBookings };
};

// filter tutor services
const getAllFilterTutorsService = async (req: any) => {
  let { subject, search, page = 1, limit = 10, minPrice, maxPrice } = req.query;
  if (subject) {
    if (Array.isArray(subject)) {
      subject = subject.map((s) => s.toLowerCase());
    } else {
      subject = subject.toLowerCase();
    }
  }

  // Pagination
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Base where condition
  const whereCondition: any = {
    role: UserRole.TUTOR,
    isTutorApproved: true,
  };

  // Subject filter
  if (subject) {
    if (Array.isArray(subject)) {
      whereCondition.subject = { hasSome: subject }; // array contains at least one
    } else {
      whereCondition.subject = { has: subject }; // array contains single subject
    }
  }

  // Search filter
  if (search) {
    whereCondition.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { about: { contains: search, mode: "insensitive" } },
      { subject: { has: search.toLowerCase() } }, // works with array<string>
    ];
  }

  if (minPrice || maxPrice) {
    whereCondition.hourlyRate = {};
    if (minPrice) whereCondition.hourlyRate.gte = Number(minPrice);
    if (maxPrice) whereCondition.hourlyRate.lte = Number(maxPrice);
  }

  const total = await prisma.user.count({ where: whereCondition });

  // data query
  const tutors = await prisma.user.findMany({
    where: whereCondition,
    skip,
    take: limitNum,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      hourlyRate: true,
      subject: true,
      rating: true,
      role: true,
      studentReviewes: true,
      profileImage: true,
      education: true,
      experience: true,
      about: true,
      createdAt: true,
    },
  });

  return {
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
    data: tutors,
  };
};

export const findTutorAndBookingService = {
  getAllTurorsService,
  getTutorByIdService,
  createBookingService,
  getDailyScheduleAndBookingService,
  getBookingRequestService,
  acceptOrRejectBookingRequestService,
  getBookingRequestForTutorService,
  getAllFilterTutorsService,
};
