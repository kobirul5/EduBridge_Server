// import { UserRole } from '@prisma/client';
import express from 'express';
import { PaymentController } from './Payment.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';


const router = express.Router();

router.post('/', auth(), PaymentController.createPrice);
router.get(
    '/tutor-earning',
    auth(),
    PaymentController.getAllTutorEarning
);

router.get('/get-all-payments', auth(UserRole.ADMIN), PaymentController.getAllPayment);
router.get('/get-payment/:id', auth(), PaymentController.getSinglePayment);

router.get('/my-payments', auth(), PaymentController.getMyPayments);


export const paymentRoutes = router;
