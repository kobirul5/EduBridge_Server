import { Router } from 'express';
import { findTutorAndBookingController } from './findTutorAndBooking.controller';
import auth from '../../middlewares/auth';


const router = Router();

router.get('/tutors', auth(), findTutorAndBookingController.getFindTutorAndBooking);
router.get('/tutor/:id', auth(), findTutorAndBookingController.getTurorById);
router.post('/save-tutor/:id', auth(), findTutorAndBookingController.saveTutor);


export const findTutorAndBookingRoutes = router;