import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '1h',
    algorithm: 'HS256',
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Decode JWT token without verification (for blacklist checks)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Generate tokens pair (access + refresh)
 */
export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
