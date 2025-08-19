
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { tutorService } from './tutor.service';
import httpStatus from 'http-status';


const getAllStats = catchAsync(async (req, res) => {
  const sitterId = req.user.id
  const result = await tutorService.getAllTutorStats(sitterId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tutors fetched successfully!',
    data: result,
  });
});


export const tutorController = {
  getAllStats
};