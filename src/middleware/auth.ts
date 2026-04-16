import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('No authorization token provided', 401);
    }

    // To Complete

    next();
  } catch (error) {
    next(error);
  }
};
