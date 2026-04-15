/**
 * Utility helper functions
 */

// Pagination helper
export const getPagination = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (...args: any[]) => Promise.resolve(fn(...args)).catch(args[2]); // args[2] is next
};

// Format response
export const formatResponse = <T>(data: T, message: string = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

// Hash password (example - use bcrypt in production)
export const hashPassword = (password: string): string => {
  // TODO: Implement proper hashing with bcrypt
  return Buffer.from(password).toString('base64');
};

// Verify password (example - use bcrypt in production)
export const verifyPassword = (password: string, hash: string): boolean => {
  // TODO: Implement proper verification with bcrypt
  return Buffer.from(password).toString('base64') === hash;
};

// Helper function to generate unique account number
export const generateAccountNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const random = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 random chars
  return `ACC${timestamp}${random}`;
};
