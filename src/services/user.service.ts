import prisma from '../config/database.ts';
import { generateAccountNumber } from '../utils/helpers.ts';
import { CreateUserInput } from '../zod-schema/user.schema.ts';

export const userService = {
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async createUser(data: CreateUserInput) {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      throw new Error('Phone number already exists');
    }

    // Generate account number if not provided
    let accountNumber = data.accountNumber;
    if (!accountNumber) {
      accountNumber = generateAccountNumber();
      // Ensure uniqueness
      let isUnique = false;
      while (!isUnique) {
        const existing = await prisma.user.findUnique({
          where: { accountNumber },
        });
        if (!existing) {
          isUnique = true;
        } else {
          accountNumber = generateAccountNumber();
        }
      }
    }

    return prisma.user.create({
      data: {
        ...data,
        accountNumber,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
