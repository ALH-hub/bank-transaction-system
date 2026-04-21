import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.js';
import { AppError } from './error.js';
import prisma from '../config/database.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: JWTPayload;
  token?: string;
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authorization token provided', 401);
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    req.token = token;

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check if token is blacklisted
    const blacklistedToken = await prisma.token.findUnique({
      where: { token },
    });

    if (blacklistedToken && (blacklistedToken.isBlacklisted || !blacklistedToken.isValid)) {
      throw new AppError('Token has been revoked', 401);
    }

    req.userId = decoded.userId;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `You don't have permission to access this resource. Required roles: ${allowedRoles.join(', ')}`,
          403,
        ),
      );
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);

      if (decoded) {
        req.userId = decoded.userId;
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
