import { Prisma, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Request } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import prisma from "../../../shared/prisma";


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




export const userService = {
 createUserIntoDb,
};
