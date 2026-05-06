
import { BookingStatus } from '@prisma/client';
import ApiError from '../../../errors/ApiErrors';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { findTutorAndBookingService } from './findTutorAndBooking.service';
import httpStatus from 'http-status';
import { Request, Response } from 'express';



const getFindTutorAndBooking = catchAsync(async (req, res) => {
  const filters = {
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    subject: req.query.subject,
  };

  const result = await findTutorAndBookingService.getAllTutorsService(filters);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tutors fetched successfully!',
    data: result,
  });
});


const getTurorById = catchAsync(async (req, res) => {

  const { id } = req.params;
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tutor ID is required');
  }

  const result = await findTutorAndBookingService.getTutorByIdService(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'FindTutorAndBooking created successfully!',
    data: result,
  });
});



const createBooking = catchAsync(async (req, res) => {
  const { tutorId, date, subject, startTime, endTime, totalAmount } = req.body;
  const studentId = req.user.id;


  const result = await findTutorAndBookingService.createBookingService(tutorId, studentId, date, subject, startTime, endTime, totalAmount);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Booking created successfully!',
    data: result,
  });
});

const findDailyScheduleAndBooking = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const result = await findTutorAndBookingService.getDailyScheduleAndBookingService(studentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Daily schedule and booking retrieved successfully!',
    data: result,
  });
});

// booking request for tutor

const getBookingRequestForTutor = catchAsync(async (req, res) => {
  const tutorId = req.user.id;
  const result = await findTutorAndBookingService.getBookingRequestService(tutorId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Booking requests retrieved successfully!',
    data: result,
  });
});

const acceptOrCancelledBookingRequest = catchAsync(async (req:Request, res:Response) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  } 

  const data = req.body;
  if (!data.bookingStatus  || (data.bookingStatus !== BookingStatus.CONFIRMED && data.bookingStatus !== BookingStatus.CANCELLED)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Booking status is required and must be either 'CONFIRMED' or 'CANCELLED'");
  }



  const result = await findTutorAndBookingService.acceptOrRejectBookingRequestService(bookingId, data.bookingStatus, userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Booking request accepted successfully!',
    data: result,
  });
});


// get accepted booking for tutor
const getAcceptedBookingForTutor = catchAsync(async (req, res) => {
  const tutorId = req.user.id;
  const result = await findTutorAndBookingService.getBookingRequestForTutorService(tutorId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Accepted bookings retrieved successfully!',
    data: result,
  });
});

const getAllFilterTutorsController = catchAsync(async (req, res) => {
  const result = await findTutorAndBookingService.getAllFilterTutorsService(req);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Filter turors retrieved successfully!',
    data: result,
  });
});





export const findTutorAndBookingController = {
  getFindTutorAndBooking,
  getTurorById,
  createBooking,
  findDailyScheduleAndBooking,
  getBookingRequestForTutor,
  acceptOrCancelledBookingRequest,
  getAcceptedBookingForTutor,
  getAllFilterTutorsController
};