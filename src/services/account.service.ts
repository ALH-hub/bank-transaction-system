import prisma from '../config/database.js';
import { generateAccountNumber } from '../utils/helpers.js';
import { CreateAccountInput, UpdateAccountInput } from '../zod-schema/auth-account.schema.js';

export const accountService = {
  async getAllAccounts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        select: {
          id: true,
          userId: true,
          accountNumber: true,
          accountType: true,
          balance: true,
          currency: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.account.count(),
    ]);

    return {
      data: accounts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  async getUserAccounts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          accountNumber: true,
          accountType: true,
          balance: true,
          currency: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.account.count({ where: { userId } }),
    ]);

    return {
      data: accounts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  async getAccountById(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  },

  async createAccount(userId: string, data: CreateAccountInput) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has an account of this type
    const existingAccountOfType = await prisma.account.findFirst({
      where: {
        userId,
        accountType: data.accountType,
      },
    });

    if (existingAccountOfType) {
      throw new Error(`User already has a ${data.accountType} account`);
    }

    // Generate unique account number
    let accountNumber = generateAccountNumber();
    let isUnique = false;

    while (!isUnique) {
      const existing = await prisma.account.findUnique({
        where: { accountNumber },
      });
      if (!existing) {
        isUnique = true;
      } else {
        accountNumber = generateAccountNumber();
      }
    }

    // Create account with initial balance
    const account = await prisma.account.create({
      data: {
        userId,
        accountNumber,
        accountType: data.accountType,
        currency: data.currency,
        balance: data.initialBalance,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return account;
  },

  async updateAccount(accountId: string, data: UpdateAccountInput) {
    // Check if account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Update account
    const updated = await prisma.account.update({
      where: { id: accountId },
      data,
      select: {
        id: true,
        userId: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  },

  async deleteAccount(accountId: string) {
    // Check if account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Check if account has zero balance (optional: can be removed if you want to allow deletion with balance)
    if (account.balance !== 0) {
      throw new Error('Cannot delete account with non-zero balance');
    }

    // Delete account
    await prisma.account.delete({
      where: { id: accountId },
    });

    return { message: 'Account deleted successfully' };
  },

  async getAccountByNumber(accountNumber: string) {
    const account = await prisma.account.findUnique({
      where: { accountNumber },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  },
};
