
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import stripe from '../../../shared/stripe';
import { getTransactionId } from '../../../shared/getTransactionId';
import { NotificationType, PaymentStatus, UserRole } from '@prisma/client';
import { notificationService } from '../Notification/Notification.service';




const createPaymentIntent = async ({
  paymentMethod,
  bookingId,
  currency = "usd",
  userId,
}: IPaymentIntent) => {
  const transactionId = getTransactionId();

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Find booking
  const bookingData = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      tutor: true,
    },
  });

  if (!bookingData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service request not found");
  }

  // if (!bookingData.bookingsStatus) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Service request is not Accepted");
  // }

  if (bookingData.paymentStatus === PaymentStatus.COMPLETED) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment already completed");
  }



  try {
    // Stripe payment create
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(bookingData.totalAmount! * 100), // convert to cents
      currency,
      payment_method: paymentMethod,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        bookingId: bookingId,
        transactionId,
        studentId: userId,
        tutorId: bookingData.tutorId,
        amount: bookingData.totalAmount!,
      },
    });

    if (paymentIntent.status !== "succeeded") {
      // Create failed payment record
      await prisma.payment.create({
        data: {
          bookingId: bookingId,
          transactionId,
          amountPaid: bookingData.totalAmount!,
          paymentStatus: PaymentStatus.FAILED,
          studentID: userId,
          tutorID: bookingData.tutorId,
          paymentMethod: "CARD",
          paymentGateway: "STRIPE",
        },
      });

     

      throw new ApiError(httpStatus.BAD_REQUEST, "Payment failed");
    }

    // Transaction (Payment + Booking update)
    const payment = await prisma.$transaction(async (tx) => {
      const paymentRecord = await tx.payment.create({
        data: {
          transactionId,
          bookingId: bookingId,
          amountPaid: bookingData.totalAmount!,
          paymentStatus: PaymentStatus.COMPLETED,
          studentID: userId,
          tutorID: bookingData.tutorId,
          paymentMethod: "CARD",
          paymentGateway: "STRIPE",
          invoice_pdf: "",
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "COMPLETED",
          bookingsStatus: "CONFIRMED",
        },
      });

      await sendBookingPaymentNotifications(bookingData);

      return paymentRecord;
    });

    return payment;
  } catch (error: any) {
    console.error("Card payment error:", error);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || "Payment failed");
  }
};

const sendBookingPaymentNotifications = async (booking: any) => {
  // Payload for student
  const studentNotification = {
    title: "Payment Successful",
    body: `Your payment for booking of subject ${booking.subject} on ${booking.date} is successful. Your tutor ${booking.tutor.firstName} has confirmed the booking.`,
    type: NotificationType.BOOKING,
    data: JSON.stringify({
      tutorId: booking.tutorId,
      subject: booking.subject,
      role: "student",
    }),
    targetId: booking.student.id,
    slug: "booking-payment-success",
  };

  // Payload for tutor
  const tutorNotification = {
    title: "Booking Payment Received",
    body: `You have received payment for booking of subject ${booking.subject} on ${booking.date} by student ${booking.student.firstName}.`,
    type: NotificationType.BOOKING,
    data: JSON.stringify({
      studentId: booking.studentId,
      subject: booking.subject,
      role: "tutor",
    }),
    targetId: booking.tutor.id,
    slug: "booking-payment-received",
  };

  // Send & save student notification
  if (booking.student?.fcmToken) {
    await notificationService.sendNotification(
      booking.student.fcmToken,
      studentNotification,
      booking.student.id
    );
  }
  await notificationService.saveNotification(studentNotification, booking.student.id);

  // Send & save tutor notification
  if (booking.tutor?.fcmToken) {
    await notificationService.sendNotification(
      booking.tutor.fcmToken,
      tutorNotification,
      booking.tutor.id
    );
  }
  await notificationService.saveNotification(tutorNotification, booking.tutor.id);
}

const getAllTutorEarning = async (userId: string) => {

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User id is required!");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId, role: UserRole.TUTOR },
  });

  if(!user){
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const totalBookings = await prisma.booking.count({
    where: {
      tutorId: userId,
     paymentStatus: "COMPLETED",
    },
  });


    const result = await prisma.payment.aggregate({
    _sum: {
      amountPaid: true,
    },
    where: {
      tutorID: userId,
      paymentStatus: "COMPLETED", 
    },
  });

  if (!result._sum.amountPaid) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found with this user!");
  }


  // Total new (last 7 days) bookings
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalNewBooking = await prisma.booking.count({
    where: {
      tutorId: userId,
      paymentStatus: 'PENDING',
      createdAt: {
        gte: sevenDaysAgo, 
      },
    },
  });


  return {
    totalEarning: result._sum.amountPaid,
    totalBookings: totalBookings,
    totalNewBooking: totalNewBooking
  };
}

const getAllPayment = async () => {

  const result = await prisma.payment.findMany();

  return result
}

const getSinglePayment = async (id: string) => {

  const result = await prisma.payment.findUnique({
    where: { id: id }
  });
  return result;
}

const getMyPayments = async (userId: string) => {

  const result = await prisma.payment.findMany({
    where: { studentID: userId }
  });
  return result;
}


export const PaymentService = {
  createPaymentIntent,
  getAllTutorEarning,
  getAllPayment,
  getSinglePayment,
  getMyPayments

};
