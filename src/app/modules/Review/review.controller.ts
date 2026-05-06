import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { reviewService } from "./review.service";

 const createReview = catchAsync(async (req: Request, res: Response) => {


  const studentId = req.user.id;
  const reviewData = req.body;

  if (!studentId) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "User not authenticated" });
  }

  const result = await reviewService.createReviewService(studentId, reviewData);

  console.log("result", result);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully!",
    data: result,
  });
});

export const reviewController = {
  createReview,
  // getReviewsByEvent,
};