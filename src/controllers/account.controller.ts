import { Response, NextFunction } from 'express';
import { accountService } from '../services/account.service.js';
import { AppError } from '../middleware/error.js';
import { AuthRequest } from '../middleware/auth.js';

export const accountController = {
  async getAllAccounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await accountService.getAllAccounts(page, limit);

      res.json({
        success: true,
        message: 'Accounts retrieved successfully',
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

  async getUserAccounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Users can only see their own accounts unless they're admin
      if (req.user?.role === 'CUSTOMER' && req.userId !== userId) {
        throw new AppError('You can only view your own accounts', 403);
      }

      const result = await accountService.getUserAccounts(userId, page, limit);

      res.json({
        success: true,
        message: 'User accounts retrieved successfully',
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

  async getAccountById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { accountId } = req.params;

      const account = await accountService.getAccountById(accountId);

      // Verify ownership or admin
      if (req.user?.role === 'CUSTOMER' && account.userId !== req.userId) {
        throw new AppError('You do not have access to this account', 403);
      }

      res.json({
        success: true,
        message: 'Account retrieved successfully',
        data: account,
      });
    } catch (error: any) {
      if (error.message === 'Account not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },

  async createAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Users can only create accounts for themselves unless they're admin
      if (req.user?.role === 'CUSTOMER' && req.userId !== userId) {
        throw new AppError('You can only create accounts for yourself', 403);
      }

      const account = await accountService.createAccount(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: account,
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },

  async updateAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { accountId } = req.params;

      const account = await accountService.getAccountById(accountId);

      // Verify ownership or admin
      if (req.user?.role === 'CUSTOMER' && account.userId !== req.userId) {
        throw new AppError('You do not have permission to update this account', 403);
      }

      const updated = await accountService.updateAccount(accountId, req.body);

      res.json({
        success: true,
        message: 'Account updated successfully',
        data: updated,
      });
    } catch (error: any) {
      if (error.message === 'Account not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { accountId } = req.params;

      const account = await accountService.getAccountById(accountId);

      // Only admins or account owner can delete
      if (req.user?.role === 'CUSTOMER' && account.userId !== req.userId) {
        throw new AppError('You do not have permission to delete this account', 403);
      }

      const result = await accountService.deleteAccount(accountId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error.message === 'Account not found') {
        next(new AppError(error.message, 404));
      } else if (error.message.includes('non-zero balance')) {
        next(new AppError(error.message, 400));
      } else {
        next(error);
      }
    }
  },
};
