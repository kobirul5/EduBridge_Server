import express from 'express';
import { validate } from 'node-cron';
import validateRequest from '../../middlewares/validateRequest';
import { chatValidation } from './chat.validation';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { chatController } from './chat.controller';
import { fileUploader } from '../../../helpars/fileUploader';

const router = express.Router();


router.post(
  '/',
  validateRequest(chatValidation.chatSchema),
  auth(),
  chatController.saveChat
);

router.get(
  '/',
  auth(),
  chatController.getChats
);

router.get(
  '/:id',
  auth(),
  chatController.getChatById
);

router.put(
  '/:id',
  validateRequest(chatValidation.chatSchema),
  auth(),
  chatController.updateChat
);

router.delete(
  '/:id',
  auth(),
  chatController.deleteChat
);


router.post(
  '/image-upload',
  fileUploader.uploadMultipleImage,
  auth(),
  chatController.imageUpload
);





export const chatRoutes = router;