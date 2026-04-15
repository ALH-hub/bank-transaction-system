import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number').max(15),
  accountNumber: z
    .string()
    .min(8, 'Account number must be at least 8 characters')
    .max(20)
    .optional(),
  accountType: z.enum(['savings', 'checking', 'investment']).default('savings'),
  balance: z
    .number()
    .min(0, 'Balance cannot be negative')
    .optional()
    .default(0),
});

export const getUserSchema = z.object({
  id: z.string().cuid('Invalid user ID'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type GetUserInput = z.infer<typeof getUserSchema>;
