import { z } from "zod";

const CreateUserValidationSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .nonempty("Password is required"),
  role: z.enum(["STUDENT", "TUTOR"], {
    errorMap: () => ({ message: "Role must be either STUDENT or TUTOR" }),
  }),
});

const UserLoginValidationSchema = z.object({
  email: z.string().email().nonempty("Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .nonempty("Password is required"),
});

const userUpdateSchema = z.object({
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  gender: z.string().optional(),
  city: z.string().optional(),
  about: z.string().optional(),
  education: z.string().optional(),
  hourlyRate: z.number().optional(),
  experience: z.number().optional(),
  subject: z.array(z.string()).optional(),
  availableDays: z.array(z.string()).optional(),
  availableTime: z.array(z.string()).optional(),
  fcmToken: z.string().optional(),
});


export const UserValidation = {
  CreateUserValidationSchema,
  UserLoginValidationSchema,
  userUpdateSchema,
};

