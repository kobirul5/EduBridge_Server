// Notification.routes: Module file for the Notification.routes functionality.
import express from "express";
import { NotificationController } from "./Notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/send", auth(), NotificationController.sendNotificationToUser);

// Get all notifications
router.get("/", auth(), NotificationController.getAllNotificationsController);

// Get notifications by user ID
router.get(
  "/get",
  auth(),
  NotificationController.getNotificationByUserIdController
);

// Mark notifications as read by user ID
router.put(
  "/read",
  auth(),
  NotificationController.readNotificationByUserIdController
);

// Delete notification by id
router.delete(
  "/delete/:id",
  auth(),
  NotificationController.deleteNotificationByIdController
);

// Delete all notifications for the authenticated user
router.delete(
  "/delete-all",
  auth(),
  NotificationController.deleteAllNotificationsController
);

export const NotificationRoutes = router;
