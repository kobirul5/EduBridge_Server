import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";

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

// cretate api for getting all saved tutors

const getAllSavedTutorsService = async (studentId: string) => {
  const savedTutors = await prisma.savedTutor.findMany({
    where: {
      studentId: studentId,
    },
    include: {
      tutor: {
        select:{
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          about: true,
          subject: true,
          rating: true,
          experience: true,
          hourlyRate: true,
          tutorReview: true,
          
        }
      } // Include tutor details
    },
  });

  if (!savedTutors) {
    throw new ApiError(httpStatus.NOT_FOUND, "No saved tutors found");
  }
  return savedTutors;
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





export const favoriteTutorService ={
  saveTutorService,
  deleteSavedTutorService,
  getAllSavedTutorsService
}