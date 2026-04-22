import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AppError } from '../middleware/error.js';
import { AuthRequest } from '../middleware/auth.js';

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        next(new AppError(error.message, 409));
      } else {
        next(error);
      }
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        next(new AppError('Invalid email or password', 401));
      } else if (error.message.includes('deactivated')) {
        next(new AppError(error.message, 403));
      } else {
        next(error);
      }
    }
  },

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error: any) {
      next(new AppError('Invalid refresh token', 401));
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 401);
      }

      await authService.logout(refreshToken);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  },
};
