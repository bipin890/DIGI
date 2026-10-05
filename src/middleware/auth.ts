import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    username: string | null;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    status: string;
    permissions: any;
  };
}

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers['x-user-id'] || req.headers['x-staff-id'];

  try {
    // 1. Direct authenticated user ID header (from login session)
    if (userIdHeader) {
      const userIdNum = parseInt(userIdHeader as string, 10);
      if (!isNaN(userIdNum)) {
        const found = await db.select().from(users).where(eq(users.id, userIdNum)).limit(1);
        if (found.length > 0 && found[0].status === 'active') {
          req.dbUser = found[0];
          return next();
        }
      }
    }

    // 2. Firebase Bearer token if present
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        const existingUsers = await db.select().from(users).where(eq(users.uid, decodedToken.uid)).limit(1);
        if (existingUsers.length > 0) {
          req.dbUser = existingUsers[0];
          return next();
        }
      } catch (err) {
        // Continue to fallback
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
};

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.dbUser) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required. Please log in.' });
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.dbUser && req.dbUser.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Owner / Admin privileges required.' });
};
