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
      reviews: true,
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

const getTurorByIdService = async (id: string) => {

  const tutors = await prisma.user.findMany({
    where: { id: id, role: UserRole.TUTOR },
    select: {
      id: true,
      fullName: true,
      email: true,
      hourlyRate: true,
      subject: true,
      rating: true,
      reviews: true,
      role: true,
      profileImage: true,
      education: true,
      experience: true,
      about: true,
      createdAt: true,
    }
  });

  if (!tutors || tutors.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No tutor found");
  }
  return tutors;
}
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

export const findTutorAndBookingService = {
  getAllTurorsService,
  getTurorByIdService,
  saveTutorService,
  deleteSavedTutorService,

};