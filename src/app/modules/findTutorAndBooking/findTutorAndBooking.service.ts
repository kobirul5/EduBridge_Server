import { BookingStatus, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { get } from "http";


// TODO: Create a service to handle features related to finding tutors and booking sessions



const getAllTurorsService = async () => {

  const tutors = await prisma.user.findMany({
    where: { role: UserRole.TUTOR },
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
    }
  });

  if (!tutors || tutors.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No tutors found");
  }
  return tutors;
}

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
      role: true,
      profileImage: true,
      education: true,
      availableDays: true,
      availableTime: true,
      experience: true,
      about: true,
      createdAt: true,
    },
  });

  if (!user || user.role !== UserRole.TUTOR) {
    throw new ApiError(httpStatus.NOT_FOUND, "No tutor found");
  }

  return user;
};



const createBookingService = async (tutorId: string, studentId: string, date: Date, subject: string, startTime: Date,
  endTime: Date) => {

  if (!tutorId || !date || !subject || !startTime || !endTime) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tutor ID, date and time are required');
  }
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
  }


  const booking = await prisma.booking.create({
    data: {
      tutorId: tutorId,
      studentId: studentId,
      date: date,
      subject: subject,
      startTime: startTime,
      endTime: endTime,
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create booking");
  }
  return booking;
}
// get daily schedule and booking for a student
const getDailyScheduleAndBookingService = async (studentId: string) => {
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
  }

  const bookings = await prisma.booking.findMany({
    where: { studentId: studentId, NOT: { bookingsStatus: BookingStatus.CANCELLED } },
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
        }
      },
      // Payment:true
    },
  });

  if (!bookings || bookings.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No bookings found");
  }
  return bookings;
}

// get booking request for a tutor
const getBookingRequestService = async (tutorId: string) => {
  if (!tutorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
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
        }
      },
    },
  });


  return bookingRequests;
}

// accept or reject booking request

const acceptOrRejectBookingRequestService = async (bookingId: string, bookingsStatus: BookingStatus) => {
  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  }
  const allowedStatuses: BookingStatus[] = [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
  ];

  if (!allowedStatuses.includes(bookingsStatus)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid booking status. Must be either 'CONFIRMED' or 'CANCELLED'"
    );
  }

  if (bookingsStatus !== "CONFIRMED") {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { bookingsStatus: bookingsStatus, isAccepted: false },
    });

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
    }
    return booking;
  }


  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingsStatus: bookingsStatus, isAccepted: true },
  });
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }
  return booking;
}


// get accepted booking for a tutor
const getBookingRequestForTutorService = async (tutorId: string) => {
  if (!tutorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
  }

  const acceptedBookings = await prisma.booking.findMany({
    where: { tutorId: tutorId, bookingsStatus: BookingStatus.CONFIRMED, isPaymentDone: true },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        }
      },
    },
  });

  const uniqueDates = await prisma.booking.groupBy({
    by: ['date'],
    // _count: { _all: true }, 
    orderBy: { date: 'asc' }
  });




  return { uniqueDates, acceptedBookings };


}

export const findTutorAndBookingService = {
  getAllTurorsService,
  getTutorByIdService,
  createBookingService,
  getDailyScheduleAndBookingService,
  getBookingRequestService,
  acceptOrRejectBookingRequestService,
  getBookingRequestForTutorService,

};