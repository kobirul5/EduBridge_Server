import express from "express";
import auth from "../../middlewares/auth";
import { reviewController } from "./review.controller";


const router = express.Router();

router.post("/",auth(), reviewController.createReview);
// router.get("/event/:eventId",auth(), reviewController.getReviewsByEvent);

export const ReviewRoutes = router;
