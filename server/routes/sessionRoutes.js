import { Router } from 'express';
import {
  createSession, mySessions, getSession, updateSession, cancelSession,
  createSessionRules, updateSessionRules,
} from '../controllers/sessionController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate, validId } from '../middleware/validate.js';

const router = Router();

router.use(protect);
router.post('/', restrictTo('mentor'), createSessionRules, validate, createSession);
router.get('/my', mySessions);
router.get('/:id', validId(), validate, getSession);
router.put('/:id', validId(), updateSessionRules, validate, updateSession);
router.delete('/:id', validId(), validate, cancelSession);

export default router;
