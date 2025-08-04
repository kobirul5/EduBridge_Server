import { UserRole, UserStatus } from "@prisma/client";

export interface IUser {
  id?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  gender?: string | null;
  city?: string | null;
  role: UserRole;
  status: UserStatus;
  fcmToken?: string | null;
  profileImage?: string | null;

  otp?: number | null;
  otpExpiresAt?: Date | null;
}


export type IUserFilterRequest = {
  name?: string | undefined;
  email?: string | undefined;
  contactNumber?: string | undefined;
  searchTerm?: string | undefined;
  minAge?: number | undefined;
  maxAge?: number | undefined;
  distanceRange?: number | undefined;
}