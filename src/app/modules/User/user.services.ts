import { Prisma, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Request } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { IUser } from "./user.interface";


const createUserIntoDb = async (userData: {email: string, password:string, role:any}) => {

  console.log("Creating user with data:", userData);

  // check if user already exists
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
  });

  if (isUserExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(userData.password, Number(config.bcrypt_salt_rounds));
  

    const dataToSave = {
    email: userData.email,
    password: hashedPassword,
    role: userData.role === 'TUTOR' ? 'STUDENT' : userData.role,
    isTutorRequest: userData.role === 'TUTOR',
    isTutorApproved: false,
  };
  
  // create user
  const newUser = await prisma.user.create({
    data: dataToSave,
  });


  if (!newUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User creation failed. Please check the input data.");
  }

  return newUser;


}

// get user profile
const getMyProfile = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const userProfile = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      gender: true,
      role: true,
      city: true,
      status: true,
      fcmToken: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return userProfile;
};

const updateUserProfile = async (userId: string, updateData: Partial<IUser>,  file?: Express.Multer.File) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  

   // If file exists, upload and set profileImage url
  if (file) {
    const uploadedImageUrl = await fileUploader.uploadToDigitalOcean(file);
    updateData.profileImage = uploadedImageUrl.Location;
  }

  // Update user profile with only provided fields
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,         
      updatedAt: new Date(),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      role: true,
      status: true,
      city: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};



export const userService = {
 createUserIntoDb,
 getMyProfile,
 updateUserProfile
};
