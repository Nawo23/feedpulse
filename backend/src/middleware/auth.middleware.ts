import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  admin?: { email: string };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorised', message: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as { email: string };
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorised', message: 'Invalid or expired token' });
  }
};