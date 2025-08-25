import { Router } from 'express';
import { adminController } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { app } from 'firebase-admin';

const router = Router();

router.get('/all-users', auth(UserRole.ADMIN), adminController.getAllUsersController);

router.get('/tutor-request', auth(UserRole.ADMIN), adminController.getTutorRequestController);
router.get('/stats', auth(UserRole.ADMIN), adminController.getStatsController);
router.get('/warning-tutors', auth(UserRole.ADMIN), adminController.getWarningTutorsController);
router.post('/warning-send', auth(UserRole.ADMIN), adminController.warnTutorController);
// router.get('/my-wallet', auth(UserRole.ADMIN), adminController.getWalletController);


router.patch('/tutor-request-update', auth(UserRole.ADMIN), adminController.updateTutorRequestStatusController);
router.get('/tutor-request/:tutorId', auth(UserRole.ADMIN), adminController.getTutorRequestByIdController);
router.patch('/suspend-tutor/:tutorId', auth(UserRole.ADMIN), adminController.suspendTutorController);


export const adminRoutes = router;