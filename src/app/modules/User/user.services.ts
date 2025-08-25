import {  UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { IUser } from "./user.interface";
import { Secret } from "jsonwebtoken";


const createUserIntoDb = async (userData: { email: string, password: string, role: UserRole }) => {

  if (!userData.email || !userData.password || !userData.role) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
  }

  if(userData.role !== 'STUDENT' && userData.role !== 'TUTOR') {
    throw new ApiError(httpStatus.BAD_REQUEST, "Role must be either STUDENT or TUTOR");
  }


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
    role: userData.role,
    isTutorRequest: userData.role === 'TUTOR',
    isTutorApproved: false,
  };

  // create user
  const newUser = await prisma.user.create({
    data: dataToSave,
    select: {
      id: true,
      email: true,
      role: true,
      isTutorRequest: true,
      isTutorApproved: true,
      createdAt: true,
      updatedAt: true,

    }
  });



   const accessToken = jwtHelpers.generateToken(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.expires_in as string
    );


  if (!newUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User creation failed. Please check the input data.");
  }

  return {newUser, token: accessToken};


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
    }
  });

  return userProfile;
};

const updateUserProfile = async (userId: string, updateData: Partial<IUser>, file?: Express.Multer.File) => {
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
    
  });

  return updatedUser;
};

const postDemoVideo = async (file: any, userId: string) => {

  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Video File Requierd")

  }

  const videosData = await fileUploader.uploadToDigitalOcean(file)

  if (!videosData.Location) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Filed to Upload video")
  }


  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if(user.role !== 'TUTOR') {
    throw new ApiError(httpStatus.BAD_REQUEST, "You are not a Tutor!, Only Tutors can upload demo videos");
  }


  const data = await prisma.user.update({
    where: { id: userId },
    data: {
      demoClassUrl: videosData.Location
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
    }
  })


  return data
}


export const userService = {
  createUserIntoDb,
  getMyProfile,
  updateUserProfile,
  postDemoVideo
};
