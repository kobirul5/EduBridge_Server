import { PrismaClient } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
const prisma = new PrismaClient();



const createReviewService = async (studentId: string, payload: {
  rating: number;
  comment: string;
  tutorId: string;
}) => {
  const { rating, comment, tutorId } = payload;
  if (!rating || !comment || !tutorId) {
    throw new ApiError(httpStatus.BAD_REQUEST,"Rating, comment, and tutor ID are required");
  }


  if(studentId === tutorId) {
    throw new ApiError(httpStatus.BAD_REQUEST,"You cannot review yourself");
  }

  if(rating < 1 || rating > 5) {
    throw new ApiError(httpStatus.BAD_REQUEST,"Rating must be between 1 and 5");
  }

  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      studentId,
      tutorId,
    },
  });


   // Step 2: Get all reviews for this tutor
  const allReviews = await prisma.review.findMany({
    where: { tutorId },
    select: { rating: true },
  });

  // Step 3: Calculate average rating
  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / allReviews.length;


  await prisma.user.update({
    where: { id: tutorId },
    data: { rating: avgRating },
  });



  if (!review) {
    throw new ApiError(500,"Failed to create review");
  }

  return review;
};



export const reviewService = {
  createReviewService,
}