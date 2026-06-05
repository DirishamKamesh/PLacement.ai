import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Global rate limiter: 100 requests per 15 minutes per IP (10000 in dev)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for AI chat: 30 requests per 15 minutes per IP (10000 in dev)
export const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI chat rate limit exceeded. Please wait before sending more messages.' },
});

// Auth limiter: 10 attempts per 15 minutes per IP (10000 in dev)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});
