import rateLimit from 'express-rate-limit';

export const submitRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many submissions',
    message: 'You can submit at most 5 feedback items per hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});