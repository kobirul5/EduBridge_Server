import { NotificationType } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import admin from "./firebaseAdmin";
import httpStatus from "http-status";

interface INotificationPayload {
    title: string;
    body: string;
    receiverId: string;
    fcmToken?: string;
    senderId: string;
    type: NotificationType;
    data?: string;
}


// Send notification to a single user
// const sendSingleNotification = async (req: any) => {
//     try {
//         const { receiverId } = req.params;

//         const { title, body } = req.body;

//         if (!title || !body) {
//             throw new ApiError(400, "Title and body are required");
//         }

//         console.log(receiverId, title, body);

//         const user = await prisma.user.findUnique({
//             where: { id: receiverId },
//         });
//         // console.log(user)
//         // console.log(user?.fcmToken);
//         if (!user || !user.fcmToken) {
//             throw new ApiError(404, "User not found or FCM token not found");
//         }

//         const message = {
//             notification: {
//                 title,
//                 body,
//             },
//             // token: user.fcmToken,
//         };

//         const response = await prisma.notification.create({
//             data: {
//                 receiverId: receiverId,
//                 senderId: req.user.id,
//                 title,
//                 body,
//             },
//         });

//          await admin.messaging().send(message);
//         return response;
//     } catch (error: any) {
//         console.error("Error sending notification:", error);
//         if (error.code === "messaging/invalid-registration-token") {
//             throw new ApiError(400, "Invalid FCM registration token");
//         } else if (error.code === "messaging/registration-token-not-registered") {
//             throw new ApiError(404, "FCM token is no longer registered");
//         } else {
//             throw new ApiError(500, error.message || "Failed to send notification");
//         }
//     }
// };


const sendNotification = async (payload: INotificationPayload) => {
    const { title, body, fcmToken, receiverId, senderId, type, data } = payload;

    if (!title || !body) {
        throw new ApiError(400, "Title and body are required");
    }

    if (!fcmToken || typeof fcmToken !== "string") {
        throw new ApiError(404, "FCM token not found or invalid");
    }

    const message = {
        notification: { title, body },
        data: {
            type: type || "default",
            data: JSON.stringify(data || ""),
            receiverId: String(receiverId),
        },
        token: fcmToken,
    };

    try {
        console.log("Sending notification:", message);

        const response = await admin.messaging().send(message);

        // Save in DB only if FCM sent successfully
        const responseDB = await prisma.notification.create({
            data: { receiverId, senderId, title, body },
        });

        return { success: true, notification: responseDB, fcmResponse: response };
    } catch (error) {
        console.error("Firebase send error:", error);
        throw new ApiError(500, "Failed to send notification");
    }
};


const saveNotification = async (payload: INotificationPayload) => {
    const { title, body, receiverId, senderId } = payload;

    if (!title || !body) {
        throw new ApiError(400, "Title and body are required");
    }

    try {
        const responseDB = await prisma.notification.create({
            data: {
                receiverId,
                senderId,
                title,
                body,
            },
        });

        return { success: true, notification: responseDB };
    } catch (error) {
        console.error("DB save error:", error);
        throw new ApiError(500, "Failed to save notification");
    }
};


// Send notifications to all users with valid FCM tokens
const sendNotifications = async (req: any) => {
    try {
        const { title, body } = req.body;

        if (!title || !body) {
            throw new ApiError(400, "Title and body are required");
        }

        const users = await prisma.user.findMany({
            where: {
                fcmToken: {
                    not: null,
                },
            },
            select: {
                id: true,
                fcmToken: true,
            },
        });

        if (!users || users.length === 0) {
            return
        }

        const fcmTokens = users.map((user) => user.fcmToken);

        const message = {
            notification: {
                title,
                body,
            },
            tokens: fcmTokens,
        };

        const response = await admin
            .messaging()
            .sendEachForMulticast(message as any);

        const successIndices = response.responses
            .map((res: any, idx: number) => (res.success ? idx : null))
            .filter((_, idx: number) => idx !== null) as number[];

        const successfulUsers = successIndices.map((idx) => users[idx]);

        const notificationData = successfulUsers.map((user) => ({
            receiverId: user.id,
            senderId: req.user.id,
            title,
            body,
        }));

        await prisma.notification.createMany({
            data: notificationData,
        });

        const failedTokens = response.responses
            .map((res: any, idx: number) => (!res.success ? fcmTokens[idx] : null))
            .filter((token): token is string => token !== null);

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            failedTokens,
        };
    } catch (error: any) {
        throw new ApiError(500, error.message || "Failed to send notifications");
    }
};

// Fetch notifications for the current user
// Fetch notifications for the current user
const getNotificationsFromDB = async (req: any) => {
    try {
        const userId = req.user.id;

        // Validate user ID
        if (!userId) {
            throw new ApiError(400, "User ID is required");
        }

        // Fetch notifications for the current user
        const notifications = await prisma.notification.findMany({
            where: {
                receiverId: userId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        profileImage: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Check if notifications exist

        // Return formatted notifications
        return notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
            sender: {
                id: notification.sender.id,
                email: notification.sender.email,
                name: notification.sender.fullName || null,
                images: notification.sender.profileImage || null,
            },
        }));
    } catch (error: any) {
        throw new ApiError(500, error.message || "Failed to fetch notifications");
    }
};

// Fetch a single notification and mark it as read
const getSingleNotificationFromDB = async (
    req: any,
    notificationId: string
) => {
    try {
        const userId = req.user.id;

        // Validate user and notification ID
        if (!userId) {
            throw new ApiError(400, "You are not authorized!");
        }

        if (!notificationId) {
            throw new ApiError(400, "Notification ID is required");
        }

        // Fetch the notification
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                receiverId: userId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        profileImage: true,
                    },
                },
            },
        });

        // Mark the notification as read
        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        profileImage: true,

                    },
                },
            },
        });

        // Return the updated notification
        return {
            id: updatedNotification.id,
            title: updatedNotification.title,
            body: updatedNotification.body,
            isRead: updatedNotification.isRead,
            createdAt: updatedNotification.createdAt,
            sender: {
                id: updatedNotification.sender.id,
                email: updatedNotification.sender.email,
                name: updatedNotification.sender.fullName,
                images: updatedNotification.sender.profileImage || null,
            },
        };
    } catch (error: any) {
        throw new ApiError(500, error.message || "Failed to fetch notification");
    }
};

const deleteNotificationFromDB = async (req: any, notificationId: string) => {
    try {
        const userId = req.user.id;

        // Validate user and notification ID
        if (!userId) {
            throw new ApiError(400, "You are not authorized!");
        }

        if (!notificationId) {
            throw new ApiError(400, "Notification ID is required");
        }

        // Fetch the notification
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                receiverId: userId,
            },
        });

        // Check if the notification exists
        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }

        // Delete the notification
        await prisma.notification.delete({
            where: { id: notificationId, receiverId: userId },
        });

        // Return the deleted notification
        return null;
    } catch (error: any) {
        throw new ApiError(500, error.message || "Failed to delete notification");
    }
}

export const notificationServices = {
    sendNotification,
    sendNotifications,
    saveNotification,
    getNotificationsFromDB,
    getSingleNotificationFromDB,
    deleteNotificationFromDB
};
