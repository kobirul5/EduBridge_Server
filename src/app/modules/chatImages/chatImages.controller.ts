import { Request, Response } from "express";
import ApiError from "../../../errors/ApiErrors";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { fileUploader } from "../../../helpars/fileUploader";
import httpStatus from "http-status";

// Upload chat images
const uploadChatImages = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.images || files.images.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No images provided");
  }

  const uploadPromises = files.images.map(file => fileUploader.uploadToDigitalOcean(file));
  const uploadedImages = await Promise.all(uploadPromises);

  const imageUrls = uploadedImages.map(img => img.Location);
    if (imageUrls.length === 0) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload images");
    }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Images uploaded successfully",
    data: imageUrls
  });
});

export const ChatController = {
  uploadChatImages
}; 