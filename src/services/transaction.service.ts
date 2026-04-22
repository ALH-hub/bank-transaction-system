import prisma from '../config/database.js';
import { AppError } from '../middleware/error.js';
import {
  DepositInput,
  WithdrawInput,
  TransferInput,
} from '../zod-schema/auth-account.schema.js';

export const transactionService = {
  async getAllTransactions(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        select: {
          id: true,
          reference: true,
          type: true,
          amount: true,
          status: true,
          description: true,
          balanceBefore: true,
          balanceAfter: true,
          fromAccountId: true,
          toAccountId: true,
          fromUserId: true,
          toUserId: true,
          createdAt: true,
          fromAccount: {
            select: {
              accountNumber: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          toAccount: {
            select: {
              accountNumber: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count(),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  async getAccountTransactions(accountId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
        },
        select: {
          id: true,
          reference: true,
          type: true,
          amount: true,
          status: true,
          description: true,
          balanceBefore: true,
          balanceAfter: true,
          fromAccountId: true,
          toAccountId: true,
          createdAt: true,
          fromAccount: {
            select: {
              accountNumber: true,
            },
          },
          toAccount: {
            select: {
              accountNumber: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({
        where: {
          OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
        },
      }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  async deposit(userId: string, data: DepositInput) {
    const account = await prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Verify account belongs to user or user is admin/teller
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (account.userId !== userId && user?.role === 'CUSTOMER') {
      throw new Error('You can only deposit to your own account');
    }

    if (!account.isActive) {
      throw new Error('Account is not active');
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        fromAccountId: null,
        toAccountId: account.id,
        toUserId: account.userId,
        type: 'DEPOSIT',
        amount: data.amount,
        description: data.description || 'Deposit',
        status: 'COMPLETED',
        balanceBefore: account.balance,
        balanceAfter: account.balance + data.amount,
      },
      select: {
        id: true,
        reference: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        balanceBefore: true,
        balanceAfter: true,
        createdAt: true,
      },
    });

    // Update account balance
    await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: account.balance + data.amount,
      },
    });

    return transaction;
  },

  async withdraw(userId: string, data: WithdrawInput) {
    const account = await prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Verify account belongs to user
    if (account.userId !== userId) {
      throw new AppError('You can only withdraw from your own account', 403);
    }

    if (!account.isActive) {
      throw new AppError('Account is not active', 400);
    }

    // Check sufficient balance
    if (account.balance < data.amount) {
      throw new AppError('Insufficient balance', 400);
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        fromAccountId: account.id,
        toAccountId: null,
        fromUserId: account.userId,
        type: 'WITHDRAWAL',
        amount: data.amount,
        description: data.description || 'Withdrawal',
        status: 'COMPLETED',
        balanceBefore: account.balance,
        balanceAfter: account.balance - data.amount,
      },
      select: {
        id: true,
        reference: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        balanceBefore: true,
        balanceAfter: true,
        createdAt: true,
      },
    });

    // Update account balance
    await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: account.balance - data.amount,
      },
    });

    return transaction;
  },

  async transfer(userId: string, data: TransferInput) {
    const fromAccount = await prisma.account.findUnique({
      where: { id: data.fromAccountId },
    });

    const toAccount = await prisma.account.findUnique({
      where: { id: data.toAccountId },
    });

    if (!fromAccount) {
      throw new AppError('From account not found', 404);
    }

    if (!toAccount) {
      throw new AppError('To account not found', 404);
    }

    // Verify from account belongs to user
    if (fromAccount.userId !== userId) {
      throw new AppError('You can only transfer from your own account', 403);
    }

    if (!fromAccount.isActive || !toAccount.isActive) {
      throw new AppError('One or both accounts are not active', 400);
    }

    // Check sufficient balance
    if (fromAccount.balance < data.amount) {
      throw new AppError('Insufficient balance', 400);
    }

    // Prevent transfer to same account
    if (data.fromAccountId === data.toAccountId) {
      throw new AppError('Cannot transfer to the same account', 400);
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        fromUserId: fromAccount.userId,
        toUserId: toAccount.userId,
        type: 'TRANSFER',
        amount: data.amount,
        description: data.description || 'Transfer',
        status: 'COMPLETED',
        balanceBefore: fromAccount.balance,
        balanceAfter: fromAccount.balance - data.amount,
      },
      select: {
        id: true,
        reference: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        balanceBefore: true,
        balanceAfter: true,
        createdAt: true,
      },
    });

    // Update both account balances in transaction
    await Promise.all([
      prisma.account.update({
        where: { id: fromAccount.id },
        data: {
          balance: fromAccount.balance - data.amount,
        },
      }),
      prisma.account.update({
        where: { id: toAccount.id },
        data: {
          balance: toAccount.balance + data.amount,
        },
      }),
    ]);

    return transaction;
  },

  async getTransactionByReference(reference: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: {
        fromAccount: true,
        toAccount: true,
        fromUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        toUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction;
  },
};
