
import ApiError from '../../../errors/ApiErrors';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { findTutorAndBookingService } from './findTutorAndBooking.service';
import httpStatus from 'http-status';


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

  const result = await findTutorAndBookingService.getTurorByIdService(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'FindTutorAndBooking created successfully!',
    data: result,
  });
});


const saveTutor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tutor ID is required');
  }
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
  }


  const result = await findTutorAndBookingService.saveTutorService(id, studentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Tutor saved successfully!',
    data: result,
  });


})

const deleteSavedTutor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tutor ID is required');
  }
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
  }
  const result = await findTutorAndBookingService.deleteSavedTutorService(id, studentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tutor deleted successfully!',
    data: result,
  });
});


export const findTutorAndBookingController = {
  getFindTutorAndBooking,
  getTurorById,
  saveTutor,
  deleteSavedTutor,

};