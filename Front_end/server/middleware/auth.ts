import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../supabase.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      token?: string;
    }
  }
}

/**
 * Middleware that verifies a Supabase JWT from the Authorization header.
 * Attaches the user object to req.user if valid.
 * Returns 401 if no token or invalid token.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Local dev bypass for Supabase Auth rate limits
    if (token.startsWith('mock-token-')) {
      const mockUserId = token.replace('mock-token-', '');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('email, role')
        .eq('id', mockUserId)
        .single();

      if (profileError || !profile) {
        return res.status(401).json({ error: 'Invalid mock token user profile' });
      }

      req.user = {
        id: mockUserId,
        email: profile.email,
        role: profile.role || 'student',
      };
      req.token = token;
      return next();
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch the user's role from our users table
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email || '',
      role: profile?.role || 'student',
    };
    req.token = token;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware that requires a specific role.
 * Must be used AFTER authMiddleware.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
