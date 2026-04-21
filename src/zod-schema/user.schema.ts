import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100).optional(),
  role: z.enum(['ADMIN', 'CUSTOMER', 'TELLER']).default('CUSTOMER').optional(),
});

export const updateUserSchema = createUserSchema.omit({ password: true }).partial();

export const getUserSchema = z.object({
  id: z.string().cuid('Invalid user ID'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUserInput = z.infer<typeof getUserSchema>;

