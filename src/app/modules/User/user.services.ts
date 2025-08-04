import { Prisma, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Request } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import emailSender from "../../../shared/emailSender";
import { generateOtpEmailHtml } from "../../../shared/html";
import prisma from "../../../shared/prisma";
import { userSearchAbleFields } from "./user.costant";
import { calculateAge } from "../../../shared/calculateAge";

const createUserIntoDb = async (userData: {email: string, password:string}) => {

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

  // create user
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });

  return newUser;


}




export const userService = {
 createUserIntoDb,
};
