// Notification.service: Module file for the Notification.service functionality.

import httpStatus from "http-status";

import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { NotificationType } from "@prisma/client";
import admin from "./firebaseAdmin";


interface INotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: string;
  targetId?: string;
  slug?: string;
  fcmToken?: string;
}

const sendNotification = async (
  deviceToken: string,
  payload: INotificationPayload,
  userId: string
) => {
  // Ensure that deviceToken is a single string and not an array.
  if (!deviceToken || typeof deviceToken !== "string") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid device token");
  }

  // Create the message object.
  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      type: payload.type,
      data: payload.data || "",
      targetId: payload.targetId || "",
      slug: payload.slug || "",
    },
    token: deviceToken,
  };

  try {


    // Send notification using Firebase Admin SDK
    const response = await admin.messaging().send(message);




  } catch (error) {
    console.error("Firebase send error:", error); // Add this line

  }
};

const saveNotification = async (
  payload: INotificationPayload,
  userId: string,
) => {

  try {
    // Save the notification to the database
    await prisma.notification.create({
      data: {
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data,
        targetId: payload.targetId || "",
        slug: payload.slug || "",
        userId,
        fcmToken: payload.fcmToken || "", // Ensure fcmToken is included
      },
    });


  } catch (error) {
    console.error("Error saving notification:", error);
  }
};

const getAllNotifications = async () => {
  try {


    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Fetch user details separately to handle null cases
    const notificationsWithUser = await Promise.all(
      notifications.map(async (notification) => {
        if (!notification.userId) return { ...notification, user: null };

        const user = await prisma.user.findUnique({
          where: { id: notification.userId },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        });
        return { ...notification, user };
      })
    );


    return notificationsWithUser;
  } catch (error) {
    console.error("Error in getAllNotifications:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch notifications",
      error instanceof Error ? error.stack : undefined
    );
  }
};

const getNotificationByUserId = async (userId: string) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
    return notifications;
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch user notifications"
    );
  }
};

const readNotificationByUserId = async (userId: string) => {
  try {
    const notifications = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return notifications;
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to mark notifications as read"
    );
  }
};

const deleteNotificationById = async (
  userId: string,
  notificationId: string
) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You are not authorized to delete this notification"
      );
    }

    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to delete notification"
    );
  }
};

const deleteAllNotifications = async (userId: string) => {
  try {
    return await prisma.notification.deleteMany({
      where: { userId },
    });
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to delete notifications"
    );
  }
};

const getAdminNotifications = async () => {
  try {
    
    const notifications = await prisma.notification.findMany({
      where: { type: NotificationType.ADMIN },
      orderBy: { createdAt: "desc" },
    });

    
    return notifications;
  } catch (error) {
    console.error("Error in getAdminNotifications:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch admin notifications",
      error instanceof Error ? error.stack : undefined
    );
  }
};

export const notificationService = {
  sendNotification,
  getAllNotifications,
  getNotificationByUserId,
  readNotificationByUserId,
  deleteNotificationById,
  deleteAllNotifications,
  saveNotification,
  getAdminNotifications
};
