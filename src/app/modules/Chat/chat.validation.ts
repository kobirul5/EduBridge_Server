import { z } from 'zod';

const chatSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  message: z.string()
});



export const chatValidation = {
    chatSchema
}