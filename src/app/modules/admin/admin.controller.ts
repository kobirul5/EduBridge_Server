import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { adminService } from "./admin.service";

const getAllUsersController = catchAsync(async (req, res) => {

  const query = req.query as Record<string, string>;

  const result = await adminService.getAllUsers(query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Admin created successfully!',
    data: result,
  });
});


// get tutor request
const getTutorRequestController = catchAsync(async (req, res) => {
  const adminId = req.user?.id;
  const result = await adminService.getTutorRequest({ adminId });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tutor request fetched successfully!',
    data: result,
  });
});

// get tutor request by id
const getTutorRequestByIdController = catchAsync(async (req, res) => {
  const { tutorId } = req.params;
  const adminId = req.user?.id;
  const result = await adminService.getTutorRequestById({tutorId, adminId });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tutor request fetched successfully!',
    data: result,
  });
});

const updateTutorRequestStatusController = catchAsync(async (req, res) => {
  const {tutorId, status}= req.body;
  const adminId = req.user?.id;
  const result = await adminService.updateTutorRequestStatus({tutorId, adminId, status });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tutor request updated successfully!',
    data: result,
  });
})

// get stats
const getStatsController = catchAsync(async (req, res) => {
  const result = await adminService.getStatsService();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stats fetched successfully!',
    data: result,
  });
});


// get warning tutors
const getWarningTutorsController = catchAsync(async (req, res) => {
  const result = await adminService.getWarningTutorsService();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Warning Tutors fetched successfully!',
    data: result,
  });
})

// // get wallet
// const getWalletController = catchAsync(async (req, res) => {

//   const result = await adminService.getWalletService();
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Wallet fetched successfully!',
//     data: result,
//   });
// })

// warnTutorController 
const warnTutorController = catchAsync(async (req, res) => {

const adminId = req.user?.id;
const {userId, message} = req.body

  const result = await adminService.warnTutorService({userId, adminId, message});


  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tutor warned successfully!',
    data: result,
  });
})

// suspense user
const suspendTutorController = catchAsync(async (req, res) => {

  const adminId = req.user?.id;
  const tutorId = req.params.tutorId;
    const result = await adminService.suspendTutorService({tutorId, adminId});


    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Tutor suspended successfully!',
      data: result,
    });
})

export const adminController = {
  getAllUsersController,
  getTutorRequestController,
  getTutorRequestByIdController,
  updateTutorRequestStatusController,
  getStatsController,
  getWarningTutorsController,
  // getWalletController,
  warnTutorController,
  suspendTutorController

};