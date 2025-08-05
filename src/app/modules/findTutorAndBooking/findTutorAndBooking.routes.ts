import { Router } from 'express';
import { findTutorAndBookingController } from './findTutorAndBooking.controller';
import auth from '../../middlewares/auth';


const router = Router();

router.get('/tutors', auth(), findTutorAndBookingController.getFindTutorAndBooking);
router.get('/tutor/:id', auth(), findTutorAndBookingController.getTurorById);


export const findTutorAndBookingRoutes = router;