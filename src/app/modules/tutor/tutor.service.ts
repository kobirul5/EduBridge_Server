import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";

const getAllTutorStats = async ({ tutorId }: { tutorId: string }) => {
  // 1. Total Earnings (completed payments for this tutor)

  // const totalEarnings = await prisma.({

  // })

  // 2. Total Bookings (for this tutor)
  const totalBookings = await prisma.booking.count({
    where: { tutorId: tutorId, paymentStatus: "COMPLETED" }
  });

  // 3. New Bookings (today only, for this tutor)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newBookings = await prisma.booking.count({
    where: {
      tutorId: tutorId,
      createdAt: { gte: today }
    }
  });

  return {
    totalBookings,
    newBookings
  };
};

export const tutorService = {
  getAllTutorStats
};