import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";
import { Request, Response } from "express";
import pick from "../../../shared/pick";
import { userFilterableFields } from "./user.costant";
import ApiError from "../../../errors/ApiErrors";

const createUser = catchAsync(async (req: Request, res: Response) => {

  if (!req.body.email || !req.body.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email and password are required.");
  }

  const result = await userService.createUserIntoDb(req.body);



  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User created successfully!",
    data: result,
  });
});


const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const result = await userService.getMyProfile(userToken as string);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User profile retrieved successfully",
    data: result,
  });
});


// * Update user profile
const updateProfileController = catchAsync(async (req: Request, res: Response) => {

  const userId = req.user.id;
  const updateData = JSON.parse(req.body.data);
  const file = req.file;


  const user = await userService.updateUserProfile(userId, updateData, file);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile updated successfully",
    data: user,
  });
});





const postDemoVideo = async(req: any, res: Response) => {

  const userId = req.user.id;
  const file = req.file
  const result = await userService.postDemoVideo(file, userId)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile updated successfully",
    data: result,
  });
}


const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await userService.deleteAccount(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const userController = {
  createUser,
  getMyProfile,
  updateProfileController,
  postDemoVideo,
  deleteAccount
};
