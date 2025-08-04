import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";


const loginUser = catchAsync(async (req: Request, res: Response) => {

  const result = await AuthServices.loginUser(req.body);
  res.cookie("token", result.token, { httpOnly: true });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Successfully logged out",
    data: null,
  });
});

// get user profile


// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;
  const { oldPassword, newPassword } = req.body;

  const result = await AuthServices.changePassword(
    userToken as string,
    newPassword,
    oldPassword
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Password changed successfully",
    data: result,
  });
});


// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {

  if(!req.body.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
  }

  const result= await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Check your email!",
      data: result
  })
});


 // resend OTP
const resendOtp = catchAsync(async (req: Request, res: Response) => {

  const result= await AuthServices.resendOtp(req.body.email);

  sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Check your email!",
      data: result
  })
});
const verifyForgotPasswordOtp = catchAsync(async (req: Request, res: Response) => {

  const result= await AuthServices.verifyForgotPasswordOtp(req.body);

  sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Check your email!",
      data: result
  })
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {



  await AuthServices.resetPassword( req.body);

  sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password Reset!",
      data: null
  })
});


//delete user
const deleteUserController = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;
  console.log("User token:", userToken);

  if (!userToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const decodedToken= jwtHelpers.verifyToken(
    userToken,
    process.env.JWT_SECRET as string
  );

  if (!decodedToken || !decodedToken.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  console.log("Decoded token:", decodedToken);
  const result = await AuthServices.deleteUser(decodedToken.id as string);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User deleted successfully",
    data: result,
  });
})

export const AuthController = {
  loginUser,
  logoutUser,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp,
  verifyForgotPasswordOtp,
  deleteUserController
  
};
