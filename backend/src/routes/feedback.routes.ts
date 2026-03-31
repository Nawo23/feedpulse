import { Router } from 'express';
import {
  submitFeedback, getAllFeedback, getFeedbackById,
  updateFeedbackStatus, deleteFeedback, reanalyseFeedback,
  getWeeklySummary, getStats,
} from '../controllers/feedback.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { submitRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
router.post('/', submitRateLimiter, submitFeedback);
router.get('/', authMiddleware, getAllFeedback);
router.get('/summary', authMiddleware, getWeeklySummary);
router.get('/stats', authMiddleware, getStats);
router.get('/:id', authMiddleware, getFeedbackById);
router.patch('/:id', authMiddleware, updateFeedbackStatus);
router.post('/:id/reanalyse', authMiddleware, reanalyseFeedback);
router.delete('/:id', authMiddleware, deleteFeedback);
export default router;
