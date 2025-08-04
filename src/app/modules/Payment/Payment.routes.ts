import { UserRole } from '@prisma/client';
import express from 'express';
import { PaymentController } from './Payment.controller';
import auth from '../../middlewares/auth';


const router = express.Router();

router.post('/create-price', PaymentController.createPrice);
router.get('/prices', PaymentController.getAllPrices);
router.get('/prices/:id', PaymentController.getPriceById);
router.get('/package/:id', PaymentController.getPackageByPriceId);
router.put('/prices/:id', PaymentController.updatePrice);
router.delete('/prices/:id', PaymentController.deletePrice);
router.post('/buy-subscription',auth(UserRole.USER), PaymentController.buySubscription);
router.post('/update-subscription',auth(UserRole.USER), PaymentController.updateSubscription);
router.post('/cancel-subscription',auth(UserRole.USER), PaymentController.cancelSubscription);
 // get last day transaction
  router.get('/last-day', PaymentController.getLastDayTransaction)
  router.get('/all-revenue', PaymentController.getAllRevenue)
  router.get('/all-member', PaymentController.getMemberCount)
  router.get('/monthly-statistic', PaymentController.monthlyStatistics)
  router.get('/membership', PaymentController.getMemberPlanCount)
  router.get('/', PaymentController.getAllPayments)


export const paymentRoutes = router;
