import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpars/fileUploader";

const router = express.Router();

// *!register user
router.post(
  "/register",
  validateRequest(UserValidation.CreateUserValidationSchema),
  userController.createUser
);

router.get(
  "/get-me",
  auth(UserRole.ADMIN, UserRole.STUDENT),
  userController.getMyProfile
);

router.patch(
  "/update-profile",
  auth(),
  // validateRequest(UserValidation.userUpdateSchema),
  fileUploader.uploadSingle,
  userController.updateProfileController
);

router.post("/demo-class", auth(), fileUploader.uploadFile, userController.postDemoVideo )


export const userRoutes = router;
