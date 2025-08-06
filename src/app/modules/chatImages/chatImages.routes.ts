import express from 'express';
import { fileUploader } from "../../../helpars/fileUploader";
import auth from "../../middlewares/auth";
import { ChatController } from './chatImages.controller';



const router = express.Router();
// Upload chat images
router.post(
  '/upload',
  auth(),
  fileUploader.uploadMultipleImage,
  ChatController.uploadChatImages
);

export const chatImageRoutes = router; 