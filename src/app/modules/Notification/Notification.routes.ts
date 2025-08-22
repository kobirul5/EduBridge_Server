import express from "express";
import auth from "../../middlewares/auth";
import { notificationController } from "./Notification.controller";

const router = express.Router();

router.post(
  "/send-notification/:receiverId",
  auth(),
  notificationController.sendNotification
);

// router.post(
//   "/send-notification",
//   auth(),
//   notificationController.sendNotifications
// );

router.get("/", auth(), notificationController.getNotifications);
router.get(
  "/:notificationId",
  auth(),
  notificationController.getSingleNotificationById
);

router.delete(
  "/:notificationId",
  auth(),
  notificationController.deleteNotification
);

export const notificationsRoute = router;
