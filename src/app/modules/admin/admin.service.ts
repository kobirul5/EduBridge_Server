import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { QueryBuilder } from "../../../shared/QueryBuilder";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

interface GetAllUsersQuery {
  role?: UserRole;       // STUDENT / TUTOR
  searchTerm?: string; // search by fullName or email
  page?: string;       // page number
  limit?: string;      // page size
  sort?: string;
  subject?: string      // e.g., "-createdAt"
}

const getAllUsers = async (query: GetAllUsersQuery) => {
  const { role, subject, searchTerm, page = "1", limit = "10", sort = "-createdAt" } = query;

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Sorting
  const orderBy = sort.startsWith("-")
    ? { [sort.substring(1)]: "desc" }
    : { [sort]: "asc" };

  // WHERE condition
  const where: any = {
    NOT: { role: UserRole.ADMIN }, // always exclude admin
  };

  if (role) {
    where.role = role;
  }

  if (subject && role === UserRole.TUTOR) {
    where.subject = {
      has: subject, // subject array er moddhe check korbe
    };
  }

  if (searchTerm) {
    where.OR = [
      { fullName: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Fetch data
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        subject: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const getTutorRequest = async ({ adminId }: { adminId: string }) => {

  const admin = await prisma.user.findUnique({
    where: { id: adminId, role: UserRole.ADMIN },
  });
  if (!admin) {
    throw new Error("Admin not found!");
  }

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized  request!");
  }


  const result = await prisma.user.findMany({
    where: { isTutorApproved: false, isTutorRequest: true, role: UserRole.TUTOR },
    select: {
      id: true,
      fullName: true,
      experience: true,
      email: true,
      role: true,
      subject: true,
      createdAt: true,
    }
  });
  return result;
};


// get tutor request by id
const getTutorRequestById = async ({ tutorId, adminId }: { tutorId: string, adminId: string }) => {

  if (!tutorId ) {
    throw new Error("User tutor id  is required");
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId, role: UserRole.ADMIN },
  });
  if (!admin) {
    throw new Error("Admin not found!");
  }

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized  request!");
  }


  const result = await prisma.user.findUnique({
    where: { id: tutorId }
  });
  return result;


};

export const adminService = {
  getAllUsers,
  getTutorRequest,
  getTutorRequestById
};