import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import { likeController } from "./Like.controller";

const router = Router();

router.post(
  "/:id",
  auth(UserRole.ADMIN, UserRole.USER),
  likeController.toggleLike
);
// get all my like id

router.get(
  "/my-likes",
  auth(UserRole.ADMIN, UserRole.USER),
  likeController.getAllMyLikeIds
);
router.get(
  "/my-likes-user",
  auth(UserRole.ADMIN, UserRole.USER),
  likeController.getAllMyLikeUsers
);

// peers like
router.get(
  "/peer-likes",
  auth(UserRole.ADMIN, UserRole.USER),
  likeController.getPeerLikes
);

export const likeRouter = router;
