/**
 * Utility helper functions
 */

/**
 * Calculate pagination parameters
 * @param page - Page number (default: 1)
 * @param limit - Number of items per page (default: 10)
 * @returns
 * Object containing skip and take values for pagination
 * Example: getPagination(2, 10) => { skip: 10, take: 10, page: 2, limit: 10 }
 * This means skip the first 10 items and take the next 10 items for page 2
 * If page is 1, skip will be 0 (no items skipped)
 */
export const getPagination = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

/**
 * Async handler to wrap async functions and catch errors
 * @param fn
 * @returns
 * A function that executes the async function and catches any errors, passing them to the next middleware
 * Example usage: app.get('/api/users', asyncHandler(userController.getAllUsers));
 */
export const asyncHandler = (fn: Function) => {
  return (...args: any[]) => Promise.resolve(fn(...args)).catch(args[2]); // args[2] is next
};

/**
 * Format API response
 * @param data
 * @param message
 * @returns
 * Object containing success status, message, and data
 */
export const formatResponse = <T>(data: T, message: string = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Hash password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = (password: string): string => {
  // Implement proper hashing with bcrypt
  return Buffer.from(password).toString('base64');
};

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash, false otherwise
 */
export const verifyPassword = (password: string, hash: string): boolean => {
  // Implement proper verification with bcrypt
  return Buffer.from(password).toString('base64') === hash;
};

/**
 * Generate a unique account number
 * @returns
 * A unique account number string
 * Format: ACC + last 8 digits of timestamp + 5 random uppercase chars
 * Example: ACC12345678ABCDE
 */
export const generateAccountNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const random = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 random chars
  return `ACC${timestamp}${random}`;
};
