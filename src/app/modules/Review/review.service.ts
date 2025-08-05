import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();



const createReviewService = async (studentId: string, payload: {
  rating: number;
  comment: string;
  tutorId: string;
}) => {
  const { rating, comment, tutorId } = payload;
  if (!rating || !comment || !tutorId) {
    throw new Error("Rating, comment, and tutor ID are required");
  }


  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      studentId,
      tutorId,
    },
  });
  if (!review) {
    throw new Error("Failed to create review");
  }

  return review;
};



export const reviewService = {
  createReviewService,
}