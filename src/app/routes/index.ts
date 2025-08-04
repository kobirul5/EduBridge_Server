import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { chatRoutes } from "../modules/Chat/chat.routes";
import { notificationsRoute } from "../modules/Notification/Notification.routes";
import { paymentRoutes } from "../modules/Payment/Payment.routes";
import { userRoutes } from "../modules/User/user.route";
import { likeRouter } from "../modules/Like/Like.routes";
import { ReviewRoutes } from "../modules/Review/review.route";


const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/like",
    route: likeRouter,
  },
  
  {
    path: "/chats",
    route: chatRoutes,
  },
  {
    path: "/payment",
    route: paymentRoutes,
  },
  {
    path: "/notifications",
    route: notificationsRoute,
  },
  {
    path: "/review",
    route: ReviewRoutes,
  },

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
