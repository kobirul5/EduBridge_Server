import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import ApiError from "../../../errors/ApiErrors";
import sendResponse from "../../../shared/sendResponse";
import { favoriteTutorService } from "./favoriteTutor.service";

const saveTutor = catchAsync(async (req, res) => {

  const { id } = req.params;

  const studentId = req.user.id;
  console.log('saveTutor called with id:', id, 'and studentId:', studentId);
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tutor ID is required');
  }
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
  }


  const result = await favoriteTutorService.saveTutorService(id, studentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Tutor saved successfully!',
    data: result,
  });


})


//  get all saved tutors
const getAllSavedTutors = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
  }
  const result = await favoriteTutorService.getAllSavedTutorsService(studentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Saved tutors retrieved successfully!', 
    data: result,
  });
});


const deleteSavedTutor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tutor ID is required');
  }
  if (!studentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expire token or invalid token');
  }
  const result = await favoriteTutorService.deleteSavedTutorService(id, studentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tutor deleted successfully!',
    data: result,
  });
});



export const favoriteTutorController = {
  saveTutor,
  deleteSavedTutor,
  getAllSavedTutors,
};