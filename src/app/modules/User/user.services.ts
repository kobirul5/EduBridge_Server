import {  UserRole, UserStatus } from "@prisma/client";
import crypto from "crypto";
import emailSender from "../../../shared/brevoEmailSender";
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

  // Generate OTP
  const otp = Number(crypto.randomInt(1000, 9999));
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  const dataToSave = {
    email: userData.email,
    password: hashedPassword,
    role: userData.role,
    isTutorRequest: userData.role === 'TUTOR',
    isTutorApproved: false,
    status: UserStatus.INACTIVE,
    otp,
    otpExpiresAt: otpExpires,
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

  // Send email content
  const html = `
<div style="font-family: Arial, sans-serif; color: #333; padding: 30px; background: linear-gradient(135deg, #6c63ff, #3f51b5); border-radius: 8px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #ffffff; font-size: 28px; text-align: center; margin-bottom: 20px;">
            <span style="color: #ffeb3b;">Welcome to EduBridge!</span>
        </h2>
        <p style="font-size: 16px; color: #333; line-height: 1.5; text-align: center;">
            Thank you for registering. Your verification OTP code is below.
        </p>
        <p style="font-size: 32px; font-weight: bold; color: #ff4081; text-align: center; margin: 20px 0;">
            ${otp}
        </p>
        <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
                This OTP will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
            </p>
            <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
                If you need assistance, feel free to contact us.
            </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 12px; color: #999; text-align: center;">
                Best Regards,<br/>
                <span style="font-weight: bold; color: #3f51b5;">EduBridge Team</span>
            </p>
        </div>
    </div>
</div> `;

  try {
    await emailSender(userData.email, html, "Verify Your Email - EduBridge");
  } catch (err) {
    console.error("[register] failed to send email:", err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to send verification email. Please try again.");
  }



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
 const profileComplete = isProfileComplete(userProfile);


  return {...userProfile, isProfileComplete: profileComplete};
};

export const isProfileComplete = (user: any): boolean => {
  if (!user) return false;


  // string / number fields
  if (
    !user.fullName ||
    !user.phoneNumber ||
    !user.gender ||
    !user.city ||
    !user.education ||
    !user.about
  ) {
    return false;
  }

  // number fields
  if (!user.hourlyRate || user.hourlyRate <= 0) {
    return false;
  }

  // if (!user.experience || user.experience <= 0) {
  //   return false;
  // }

  // array fields
  if (!Array.isArray(user.subject) || user.subject.length === 0) {
    return false;
  }

  if (!Array.isArray(user.availableDays) || user.availableDays.length === 0) {
    return false;
  }

  if (!Array.isArray(user.availableTime) || user.availableTime.length === 0) {
    return false;
  }

  return true;
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
      demoClassUrl: true,
      availableDays: true,
      about: true,
      isTutorApproved: true,
      status: true,
      city: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
    }
  })


  return data
}

const deleteAccount = async (userId: string) => {

  const user = await prisma.user.delete({
    where: { id: userId },
  });
  return user;
}

export const userService = {
  createUserIntoDb,
  getMyProfile,
  updateUserProfile,
  postDemoVideo,
  deleteAccount
};
