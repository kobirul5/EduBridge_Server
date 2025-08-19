import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { chatRoutes } from "../modules/Chat/chat.routes";
// import { notificationsRoute } from "../modules/Notification/Notification.routes";
// import { paymentRoutes } from "../modules/Payment/Payment.routes";
import { userRoutes } from "../modules/User/user.route";
// import { likeRouter } from "../modules/Like/Like.routes";
import { ReviewRoutes } from "../modules/Review/review.route";
import { findTutorAndBookingRoutes } from "../modules/findTutorAndBooking/findTutorAndBooking.routes";
import { chatImageRoutes } from "../modules/chatImages/chatImages.routes";
import { favoriteTutorRoutes } from "../modules/favoriteTutor/favoriteTutor.routes";
import { tutorRoutes } from "../modules/tutor/tutor.routes";



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
  // {
  //   path: "/like",
  //   route: likeRouter,
  // },
  
  {
    path: "/chats",
    route: chatRoutes,
  },
  {
    path: "/tutors",
    route: tutorRoutes
  },
  // {
  //   path: "/payment",
  //   route: paymentRoutes,
  // },
  // {
  //   path: "/notifications",
  //   route: notificationsRoute,
  // },
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

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
