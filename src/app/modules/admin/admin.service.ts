import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { QueryBuilder } from "../../../shared/QueryBuilder";

interface GetAllUsersQuery {
  role?: string;       // STUDENT / TUTOR
  searchTerm?: string; // search by fullName or email
  page?: string;       // page number
  limit?: string;      // page size
  sort?: string;       // e.g., "-createdAt"
}

const getAllUsers = async (query: GetAllUsersQuery) => {
  const { role, searchTerm, page = "1", limit = "10", sort = "-createdAt" } = query;

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

export const adminService = {
  getAllUsers
};