import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { adminService } from "./admin.service";

const createAdmin = catchAsync(async (req, res) => {
  const result = await adminService.createAdmin(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Admin created successfully!',
    data: result,
  });
});

export const adminController = {
  createAdmin,

};