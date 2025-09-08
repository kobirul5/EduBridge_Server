import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { chatRoutes } from "../modules/Chat/chat.routes";
import { userRoutes } from "../modules/User/user.route";
import { ReviewRoutes } from "../modules/Review/review.route";
import { findTutorAndBookingRoutes } from "../modules/findTutorAndBooking/findTutorAndBooking.routes";
import { chatImageRoutes } from "../modules/chatImages/chatImages.routes";
import { favoriteTutorRoutes } from "../modules/favoriteTutor/favoriteTutor.routes";
import { tutorRoutes } from "../modules/tutor/tutor.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { paymentRoutes } from "../modules/Payment/Payment.routes";
import { NotificationRoutes } from "../modules/Notification/Notification.routes";



const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/tutor-and-booking",
    route: findTutorAndBookingRoutes
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },

  {
    path: "/chats",
    route: chatRoutes,
  },
  {
    path: "/tutors",
    route: tutorRoutes
  },
  {
    path: "/payments",
    route: paymentRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/chat-images",
    route: chatImageRoutes,
  },
  {
    path: "/favorite-tutor",
    route: favoriteTutorRoutes,
  },
  {
    path: "/admins",
    route: adminRoutes
  }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
