import { Router } from 'express';
import { favoriteTutorController } from './favoriteTutor.controller';
import auth from '../../middlewares/auth';




const router = Router();

router.post('/:id', auth(), favoriteTutorController.saveTutor);
router.get('/', auth(), favoriteTutorController.getAllSavedTutors); 
router.delete('/:id',auth(), favoriteTutorController.deleteSavedTutor);

export const favoriteTutorRoutes = router;