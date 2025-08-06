import { UserRole } from "@prisma/client";
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
endTime:Date) => {

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
    where: { studentId: studentId },
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
      payment: true,
    },
  });

  if (!bookings || bookings.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No bookings found");
  }
  return bookings;
}

export const findTutorAndBookingService = {
  getAllTurorsService,
  getTutorByIdService,
  createBookingService,
  getDailyScheduleAndBookingService, 

};