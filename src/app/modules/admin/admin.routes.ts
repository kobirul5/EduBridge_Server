import { Router } from 'express';
import { adminController } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

router.post('/', validateRequest, adminController.createAdmin);


export const adminRoutes = router;