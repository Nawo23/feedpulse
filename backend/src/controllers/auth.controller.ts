import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const api = (res: Response, status: number, success: boolean, data: unknown = null, message = '', error = '') =>
  res.status(status).json({ success, data, message, error });

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { api(res, 400, false, null, '', 'Email and password are required'); return; }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@feedpulse.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      api(res, 401, false, null, '', 'Invalid credentials');
      return;
    }
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign({ email: adminEmail }, secret, { expiresIn: '24h' });
    api(res, 200, true, { token, email: adminEmail }, 'Login successful');
  } catch {
    api(res, 500, false, null, '', 'Login failed');
  }
};

export const verifyToken = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true, data: { valid: true } });
};