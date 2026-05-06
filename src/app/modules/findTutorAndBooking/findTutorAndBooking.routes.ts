import { Router } from 'express';
import { findTutorAndBookingController } from './findTutorAndBooking.controller';
import auth from '../../middlewares/auth';


const router = Router();

router.get('/tutors', auth(), findTutorAndBookingController.getFindTutorAndBooking);
router.get('/tutors-filter', auth(), findTutorAndBookingController.getAllFilterTutorsController);
router.get('/tutor/:id', auth(), findTutorAndBookingController.getTurorById);
// booking routes
router.post('/booking', auth(), findTutorAndBookingController.createBooking);
router.get('/daily-schedule', auth(), findTutorAndBookingController.findDailyScheduleAndBooking);

// booking request for tutor
router.get('/booking-requests', auth(), findTutorAndBookingController.getBookingRequestForTutor);
router.put('/booking/:bookingId', auth(), findTutorAndBookingController.acceptOrCancelledBookingRequest);
router.get('/accepted-booking', auth(), findTutorAndBookingController.getAcceptedBookingForTutor);


export const findTutorAndBookingRoutes = router;