import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { reviewService } from "./review.service";

export const createReview = catchAsync(async (req:Request, res: Response) => {
 console.log("req.body", "what aboute this line?", req.body);
 
    const userId = req.user.id;
  console.log("userId", userId);
  const reviewData = req.body;
console.log("reviewData", reviewData);
  if (!userId) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "User not authenticated" });
    }
    
  const result = await reviewService.createReview(userId, reviewData);

  console.log("result", result);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully!",
    data: result,
  });
});

export const getReviewsByEvent = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const result = await reviewService.getReviewsByEvent(eventId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews fetched successfully!",
    data: result,
  });
});
