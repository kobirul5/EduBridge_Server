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

// router.put(
//   "/update-profile",
//   // validateRequest(UserValidation.userUpdateSchema),

//   auth(UserRole.ADMIN, UserRole.USER),
//   fileUploader.uploadMultipleImage,
//   userController.updateProfile
// );



// *!get all  user
// router.get("/", userController.getUsers);
// router.get("/get-random-user", userController.getRandomUser);
// router.get("/get-user-home",auth(), userController.getUserForHomePage);
// router.get("/get-all-user",auth(), userController.getAllUsers);
// router.get("/users-and-events", auth(), userController.getAllUserAndEvents);

// router.get("/:id", userController.getSingleUserById);

// // *!profile user


// // *!update  user
// router.put("/:id", userController.updateUser);

export const userRoutes = router;
