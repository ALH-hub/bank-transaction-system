import { z } from 'zod';

// AUTH SCHEMAS

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number').max(15),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100),
  role: z.enum(['ADMIN', 'CUSTOMER', 'TELLER']).default('CUSTOMER'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ACCOUNT SCHEMAS

export const createAccountSchema = z.object({
  accountType: z.enum(['savings', 'checking', 'investment']).default('savings'),
  currency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .default('USD'),
  initialBalance: z
    .number()
    .min(1000, 'Initial balance must be at least 1000')
    .default(1000),
});

export const updateAccountSchema = z.object({
  accountType: z.enum(['savings', 'checking', 'investment']).optional(),
  currency: z.string().length(3).optional(),
  isActive: z.boolean().optional(),
});

// TRANSACTION SCHEMAS

export const depositSchema = z.object({
  accountId: z.string().cuid('Invalid account ID'),
  amount: z.number().min(100, 'Deposit amount must be at least 100'),
  description: z.string().max(500).optional(),
});

export const withdrawSchema = z.object({
  accountId: z.string().cuid('Invalid account ID'),
  amount: z.number().min(100, 'Withdrawal amount must be at least 100'),
  description: z.string().max(500).optional(),
});

export const transferSchema = z.object({
  fromAccountId: z.string().cuid('Invalid from account ID'),
  toAccountId: z.string().cuid('Invalid to account ID'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().max(500).optional(),
});

// TYPE EXPORTS

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
