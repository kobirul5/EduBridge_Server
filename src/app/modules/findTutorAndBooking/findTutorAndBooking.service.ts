import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";




const getAllTurorsService = async () => {

const tutors = await prisma.user.findMany({
  where: { role: UserRole.TUTOR },
  select: {
    id: true,
    fullName: true,
    email: true,
    tutor: {
      select: {
        expertise: true,
        hourlyRate: true,
        rating: true,
        bio: true,
        createdAt: true,
      }
    }
  }
});
 return tutors;
}



export const findTutorAndBookingService = {
  getAllTurorsService,

};