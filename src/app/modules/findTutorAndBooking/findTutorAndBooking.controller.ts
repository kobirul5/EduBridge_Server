
import { BookingStatus } from '@prisma/client';
import ApiError from '../../../errors/ApiErrors';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { findTutorAndBookingService } from './findTutorAndBooking.service';
import httpStatus from 'http-status';
import { Request, Response } from 'express';


// TODO: Create a service to handle features related to finding tutors and booking sessions
//TODO: get reviews and demo turorals for tutors using id



const getFindTutorAndBooking = catchAsync(async (req, res) => {

  const result = await findTutorAndBookingService.getAllTurorsService();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'FindTutorAndBooking created successfully!',
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
  const { tutorId, date, subject, startTime, endTime } = req.body;
  const studentId = req.user.id;


  const result = await findTutorAndBookingService.createBookingService(tutorId, studentId, date, subject, startTime, endTime);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Booking created successfully!',
    data: result,
  });
});

const findDailyscheduleAndBooking = catchAsync(async (req, res) => {
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


// accpet boioking request by booking id

const acceptOrCancelledBookingRequest = catchAsync(async (req:Request, res:Response) => {
  const { bookingId } = req.params;
  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  } 

  console.log(BookingStatus, req.body);

  const data = req.body;
  if (!data.bookingStatus  || (data.bookingStatus !== BookingStatus.CONFIRMED && data.bookingStatus !== BookingStatus.CANCELLED)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Booking status is required and must be either 'CONFIRMED' or 'CANCELLED'");
  }



  const result = await findTutorAndBookingService.acceptOrRejectBookingRequestService(bookingId, data.bookingStatus);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Booking request accepted successfully!',
    data: result,
  });
});



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






export const findTutorAndBookingController = {
  getFindTutorAndBooking,
  getTurorById,
  createBooking,
  findDailyscheduleAndBooking,
  getBookingRequestForTutor,
  acceptOrCancelledBookingRequest,
  getAcceptedBookingForTutor,
  
};