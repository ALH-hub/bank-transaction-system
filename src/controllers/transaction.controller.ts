import { Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service.js';
import { AppError } from '../middleware/error.js';
import { AuthRequest } from '../middleware/auth.js';

export const transactionController = {
  async getAllTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Only admins and tellers can view all transactions
      if (req.user?.role === 'CUSTOMER') {
        throw new AppError('You do not have permission to view all transactions', 403);
      }

      const result = await transactionService.getAllTransactions(page, limit);

      res.json({
        success: true,
        message: 'Transactions retrieved successfully',
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

  async getAccountTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { accountId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await transactionService.getAccountTransactions(accountId, page, limit);

      res.json({
        success: true,
        message: 'Account transactions retrieved successfully',
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

  async deposit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.deposit(req.userId!, req.body);

      res.status(201).json({
        success: true,
        message: 'Deposit successful',
        data: transaction,
      });
    } catch (error: any) {
      if (
        error.message === 'Account not found' ||
        error.message === 'Account is not active'
      ) {
        next(new AppError(error.message, 404));
      } else if (error.message.includes('permission')) {
        next(new AppError(error.message, 403));
      } else {
        next(error);
      }
    }
  },

  async withdraw(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.withdraw(req.userId!, req.body);

      res.status(201).json({
        success: true,
        message: 'Withdrawal successful',
        data: transaction,
      });
    } catch (error: any) {
      if (error.message === 'Account not found') {
        next(new AppError(error.message, 404));
      } else if (error.message === 'Insufficient balance' || error.message === 'Account is not active') {
        next(new AppError(error.message, 400));
      } else if (error.message.includes('permission')) {
        next(new AppError(error.message, 403));
      } else {
        next(error);
      }
    }
  },

  async transfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.transfer(req.userId!, req.body);

      res.status(201).json({
        success: true,
        message: 'Transfer successful',
        data: transaction,
      });
    } catch (error: any) {
      if (
        error.message === 'From account not found' ||
        error.message === 'To account not found'
      ) {
        next(new AppError(error.message, 404));
      } else if (
        error.message === 'Insufficient balance' ||
        error.message === 'One or both accounts are not active' ||
        error.message === 'Cannot transfer to the same account'
      ) {
        next(new AppError(error.message, 400));
      } else if (error.message.includes('permission')) {
        next(new AppError(error.message, 403));
      } else {
        next(error);
      }
    }
  },

  async getTransactionByReference(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reference } = req.params;

      const transaction = await transactionService.getTransactionByReference(reference);

      // Verify access
      if (
        req.user?.role === 'CUSTOMER' &&
        transaction.fromUserId !== req.userId &&
        transaction.toUserId !== req.userId
      ) {
        throw new AppError('You do not have access to this transaction', 403);
      }

      res.json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction,
      });
    } catch (error: any) {
      if (error.message === 'Transaction not found') {
        next(new AppError(error.message, 404));
      } else {
        next(error);
      }
    }
  },
};
