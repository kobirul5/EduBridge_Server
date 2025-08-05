import prisma from "../../../shared/prisma";


const create = async (data) => {
  return await prisma.tutor.create({ data });
};

// const getAll = async () => {
//   return await prisma.tutor.findMany();
// };

// const getById = async (id) => {
//   const item = await prisma.tutor.findUnique({ where: { id } });
//   if (!item) throw new Error('Tutor not found!');
//   return item;
// };

// const update = async (id, data) => {
//   return await prisma.tutor.update({
//     where: { id },
//     data,
//   });
// };

// const remove = async (id) => {
//   return await prisma.tutor.delete({ where: { id } });
// };

export const tutorService = {
  create,
  // getAll,
  // getById,
  // update,
  // remove,
};