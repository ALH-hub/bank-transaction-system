import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.ts';
import { AppError } from '../middleware/error.ts';

export const userController = {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAllUsers();
      const count = users.length; // Get the count of users

      res.json({
        success: true,
        message: 'All users retrieved successfully',
        data: users,
        count,
      });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req: Request, res: Response, next: NextFunction) {
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
};
