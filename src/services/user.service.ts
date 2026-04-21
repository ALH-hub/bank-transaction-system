import prisma from '../config/database.js';
import { hashPassword } from '../utils/helpers.js';
import { CreateUserInput } from '../zod-schema/user.schema.js';

export const userService = {
  async getAllUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
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

    // Hash password
    const hashedPassword = hashPassword(data.password || 'DefaultPassword123');

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role || 'CUSTOMER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  },

  async updateUser(id: string, data: Partial<CreateUserInput>) {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if new email is already taken
    if (data.email && data.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Check if new phone is already taken
    if (data.phone && data.phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existingPhone) {
        throw new Error('Phone number already exists');
      }
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName || user.firstName,
        lastName: data.lastName || user.lastName,
        email: data.email || user.email,
        phone: data.phone || user.phone,
        role: data.role || user.role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  },

  async deleteUser(id: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    // Delete user
    await prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  },

  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async activateUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  },

  async deactivateUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  },

  async updateUserRole(id: string, role: 'ADMIN' | 'CUSTOMER' | 'TELLER') {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  },
};
