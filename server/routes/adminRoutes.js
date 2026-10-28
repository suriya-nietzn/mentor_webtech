import { Router } from 'express';
import { listUsers, listUsersRules, overview } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/overview', overview);
router.get('/users', listUsersRules, validate, listUsers);

export default router;
