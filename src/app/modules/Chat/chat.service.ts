
import ApiError from '../../../errors/ApiErrors';
import { fileUploader } from '../../../helpars/fileUploader';
import prisma from '../../../shared/prisma';

const saveChatIntoDb = async (user: any, payload: any) => {
  const chat = await prisma.chat.create({
    data: {
      message: payload.message,
      senderId: user.id,
      roomId: payload.roomId,
      receiverId: payload.receiverId,
    },
  });

  return chat;
};

const getChatFromDb = async (user: any, payload: any) => {
  const chats = await prisma.chat.findMany({
    where: {
      OR: [
        {
          senderId: user.id,
          receiverId: payload.receiverId,
        },
        {
          senderId: payload.receiverId,
          receiverId: user.id,
        },
      ],
    },
  });

  return chats;
};

const getChatByIdFromDb = async (user: any, id: string) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: id,
    },
  });

  return chat;
};

const updateChatInDb = async (user: any, id: string, payload: any) => {
  const chat = await prisma.chat.update({
    where: {
      id: id,
    },
    data: {
      message: payload.message,
    },
  });

  return chat;
};

const deleteChatFromDb = async (user: any, id: string) => {
  const chat = await prisma.chat.delete({
    where: {
      id: id,
    },
  });

  return chat;
};

// upload image 
const imageUpload = async (files: Express.Multer.File[]) => {
  console.log("Uploading image")
  if (!Array.isArray(files)) {
    throw new TypeError("Expected an array of files");
  }
  const uploadPromises = files.map(async (file) => {
    const uploadResponse = await fileUploader.uploadToDigitalOcean(file);
    if (!uploadResponse || !uploadResponse.Location) {
      throw new ApiError(500, "Failed to upload file");
    }
    return uploadResponse.Location;
  });

  const fileUrls = await Promise.all(uploadPromises);

  return fileUrls;
};


export const chatServices = {
  saveChatIntoDb,
  getChatFromDb,
  getChatByIdFromDb,
  updateChatInDb,
  deleteChatFromDb,
  imageUpload,
};
