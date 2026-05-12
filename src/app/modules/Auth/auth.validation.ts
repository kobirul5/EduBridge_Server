import { z } from "zod";

const changePasswordValidationSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

const forgotPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

const verifyOtpValidationSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  otp: z.number().min(1000, "OTP must be 4 digits").max(9999, "OTP must be 4 digits"),
});

const resetPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const authValidation = {
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  verifyOtpValidationSchema,
  resetPasswordValidationSchema,
};