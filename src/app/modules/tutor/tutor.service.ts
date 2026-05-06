import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { UserRole } from "@prisma/client";

const getAllTutorStatsWithDaily = async (userId: string) => {
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User id is required!");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== UserRole.TUTOR) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tutor not found!");
  }

  // Total bookings (COMPLETED)
  const totalBookings = await prisma.booking.count({
    where: {
      tutorId: userId,
      paymentStatus: "COMPLETED",
    },
  });

  // Total earnings (COMPLETED)
  const totalPayment = await prisma.payment.aggregate({
    _sum: { amountPaid: true },
    where: {
      tutorID: userId,
      paymentStatus: "COMPLETED",
    },
  });

  const totalEarning = totalPayment._sum?.amountPaid ?? 0; // <-- safe

  // Total new bookings last 7 days (PENDING)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalNewBooking = await prisma.booking.count({
    where: {
      tutorId: userId,
      paymentStatus: "COMPLETED",
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const today = new Date();

  // Helper: generate array of dates
  const generateDates = (days: number) => {
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d.toLocaleDateString("en-CA"));
    }
    return dates;
  };

  const last7Dates = generateDates(7);
  const last30Dates = generateDates(30);

  // Fetch payments for last 30 days
  const payments = await prisma.payment.findMany({
    where: {
      tutorID: userId,
      paymentStatus: "COMPLETED",
      createdAt: { gte: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000) },
    },
    select: { amountPaid: true, createdAt: true },
  });

  const mapPayments = (dates: string[]) =>
    dates.map((date) => {
      const total = payments
        .filter(
          (p) =>
            new Date(p.createdAt).toLocaleDateString("en-CA") === date
        )
        .reduce((sum, p) => sum + (p.amountPaid ?? 0), 0); // <-- safe
      return { date, amountPaid: total };
    });

  return {
    totalEarning,
    totalBookings,
    totalNewBooking,
    last7Days: mapPayments(last7Dates),
    last30Days: mapPayments(last30Dates),
  };
};

export const tutorService = {
  getAllTutorStatsWithDaily
};