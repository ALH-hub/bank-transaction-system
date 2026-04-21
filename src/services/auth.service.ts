import prisma from '../config/database.js';
import { generateTokens, decodeToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/helpers.js';
import { RegisterInput, LoginInput } from '../zod-schema/auth-account.schema.js';

export const authService = {
  async register(data: RegisterInput) {
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
    const hashedPassword = hashPassword(data.password);

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
      },
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store tokens in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days for refresh token
    await prisma.token.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        tokenType: 'REFRESH',
        expiresAt,
        isValid: true,
      },
    });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async login(data: LoginInput) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = verifyPassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.token.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        tokenType: 'REFRESH',
        expiresAt,
        isValid: true,
      },
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async refreshAccessToken(refreshToken: string) {
    // Verify refresh token
    const decoded = decodeToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // Check if token is in database and valid
    const storedToken = await prisma.token.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.isBlacklisted || !storedToken.isValid) {
      throw new Error('Refresh token is invalid or revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token has expired');
    }

    // Generate new access token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    }).accessToken;

    return {
      accessToken,
      refreshToken, // Return same refresh token
    };
  },

  async logout(token: string) {
    // Blacklist the token
    await prisma.token.update({
      where: { token },
      data: {
        isBlacklisted: true,
        isValid: false,
      },
    });
  },

  async verifyToken(token: string) {
    const storedToken = await prisma.token.findUnique({
      where: { token },
    });

    if (!storedToken) {
      throw new Error('Token not found');
    }

    if (storedToken.isBlacklisted || !storedToken.isValid) {
      throw new Error('Token is invalid or revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Token has expired');
    }

    return storedToken;
  },
};
