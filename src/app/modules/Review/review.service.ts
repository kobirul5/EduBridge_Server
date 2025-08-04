import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const reviewService = {
  async createReview(userId: string,payload: {
    rating: number;
    comment: string;
    eventId: string;
  }) {
    return prisma.review.create({
      data: {
      userId,          
      rating: payload.rating,      
      comment: payload.comment,
      eventId: payload.eventId,
    }
    });
  },

  async getReviewsByEvent(eventId: string) {
    return prisma.review.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  },
};
