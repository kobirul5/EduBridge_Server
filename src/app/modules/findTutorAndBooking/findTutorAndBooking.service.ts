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

// Save a tutor for a student
const saveTutorService = async (tutorId: string, studentId: string) => {


  const existingSavedTutor = await prisma.savedTutor.findFirst({
    where: {
      tutorId: tutorId,
      studentId: studentId,
    },
  });

  if (existingSavedTutor) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Tutor already saved");
  }

  const savedTutor = await prisma.savedTutor.create({
    data: {
      tutorId: tutorId,
      studentId: studentId,
    },
  });

  if (!savedTutor) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save tutor");
  }
  return savedTutor;
}

// delete a saved tutor
const deleteSavedTutorService = async (tutorId: string, studentId: string) => {




  const existingSavedTutor = await prisma.savedTutor.findFirst({
    where: {
      tutorId: tutorId,
      studentId: studentId,
    },
  });

  if (!existingSavedTutor) {
    throw new ApiError(httpStatus.NOT_FOUND, "Saved tutor not found");
  }

  const deletedSavedTutor = await prisma.savedTutor.delete({
    where: {
      studentId_tutorId: {
        studentId: studentId,
        tutorId: tutorId,
      }
    }
  });


  if (!deletedSavedTutor) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to delete saved tutor");
  }
  return deletedSavedTutor;
}

const createBookingService = async (tutorId: string, studentId: string, date: Date, subject: string) => {

  if (!tutorId || !date || !subject) {
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
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create booking");
  }
  return booking;
}

export const findTutorAndBookingService = {
  getAllTurorsService,
  getTutorByIdService,
  saveTutorService,
  deleteSavedTutorService,
  createBookingService 

};