import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after a minute.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
