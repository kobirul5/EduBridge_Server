
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { findTutorAndBookingService } from './findTutorAndBooking.service';
import httpStatus from 'http-status';

const createFindTutorAndBooking = catchAsync(async (req, res) => {

  


  const result = await findTutorAndBookingService.getAllTurorsService();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'FindTutorAndBooking created successfully!',
    data: result,
  });
});



export const findTutorAndBookingController = {
  createFindTutorAndBooking,

};