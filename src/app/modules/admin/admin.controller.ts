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

export const adminController = {
  getAllUsersController,

};