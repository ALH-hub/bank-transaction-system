import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { AppError } from '../middleware/error.js';
import { AuthRequest } from '../middleware/auth.js';

export const userController = {
  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userService.getAllUsers(page, limit);

      res.json({
        success: true,
        message: 'All users retrieved successfully',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Users can only view their own profile unless they're admin
      if (req.user?.role === 'CUSTOMER' && req.userId !== id) {
        throw new AppError('You can only view your own profile', 403);
      }

      const user = await userService.getUserById(id);

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },

  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        next(new AppError(error.message, 409));
      } else {
        next(error);
      }
    }
  },

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Users can only update their own profile unless they're admin
      if (req.user?.role === 'CUSTOMER' && req.userId !== id) {
        throw new AppError('You can only update your own profile', 403);
      }

      const user = await userService.updateUser(id, req.body);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new AppError(error.message, 404));
      } else if (error.message.includes('already exists')) {
        next(new AppError(error.message, 409));
      } else {
        next(error);
      }
    }
  },

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await userService.deleteUser(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },

  async activateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await userService.activateUser(id);

      res.json({
        success: true,
        message: 'User activated successfully',
        data: user,
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },

  async deactivateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await userService.deactivateUser(id);

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: user,
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'CUSTOMER', 'TELLER'].includes(role)) {
        throw new AppError('Invalid role', 400);
      }

      const user = await userService.updateUserRole(id, role);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user,
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },
};

