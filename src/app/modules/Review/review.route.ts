import express from "express";

import { fileUploader } from "../../../helpars/fileUploader";
// import { authenticate } from "../"; // ✅ Auth middleware
import auth from "../../middlewares/auth";
import { createReview, getReviewsByEvent } from "./review.controller";

const router = express.Router();

router.post("/",auth(), createReview);
router.get("/event/:eventId",auth(), getReviewsByEvent);

export const ReviewRoutes = router;
