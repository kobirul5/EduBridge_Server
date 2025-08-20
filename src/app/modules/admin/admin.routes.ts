import { Router } from 'express';
import { adminController } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/all-users', auth(UserRole.ADMIN), adminController.getAllUsersController);

router.get('/tutor-request', auth(UserRole.ADMIN), adminController.getTutorRequestController);


export const adminRoutes = router;