
// import catchAsync from '../../../shared/catchAsync';
// import sendResponse from '../../../shared/sendResponse';
// import { tutorService } from './tutor.service';
// import httpStatus from 'http-status';

// const createTutor = catchAsync(async (req, res) => {
//   const result = await tutorService.create(req.body);
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: 'Tutor created successfully!',
//     data: result,
//   });
// });

// const getAllTutors = catchAsync(async (req, res) => {
//   const result = await tutorService.getAll();
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: 'Tutors fetched successfully!',
//     data: result,
//   });
// });

// const getTutorById = catchAsync(async (req, res) => {
//   const result = await tutorService.getById(req.params.id);
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: 'Tutor fetched successfully!',
//     data: result,
//   });
// });

// const updateTutor = catchAsync(async (req, res) => {
//   const result = await tutorService.update(req.params.id, req.body);
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: 'Tutor updated successfully!',
//     data: result,
//   });
// });

// const deleteTutor = catchAsync(async (req, res) => {
//   const result = await tutorService.remove(req.params.id);
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: 'Tutor deleted successfully!',
//     data: result,
//   });
// });

// export const tutorController = {
  // createTutor,
  // getAllTutors,
  // getTutorById,
  // updateTutor,
  // deleteTutor,
// };