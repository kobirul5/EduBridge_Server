import { Router } from 'express';
import { findTutorAndBookingController } from './findTutorAndBooking.controller';
import auth from '../../middlewares/auth';


const router = Router();

router.get('/tutors', auth(), findTutorAndBookingController.getFindTutorAndBooking);
router.get('/tutor/:id', auth(), findTutorAndBookingController.getTurorById);
// booking routes
router.post('/booking', auth(), findTutorAndBookingController.createBooking);


export const findTutorAndBookingRoutes = router;