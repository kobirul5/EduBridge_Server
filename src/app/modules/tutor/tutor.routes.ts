import { Router } from 'express';
import { tutorController } from './tutor.controller';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';


const router = Router();

router.get('/stats', auth(), tutorController.getAllStats);


export const tutorRoutes = router;