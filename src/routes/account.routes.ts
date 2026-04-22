import { Router } from 'express';
import { accountController } from '../controllers/account.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createAccountSchema,
  updateAccountSchema,
} from '../zod-schema/auth-account.schema.js';

const router = Router();

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts (Admin/Teller only)
 *     description: Retrieve all accounts in the system
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'TELLER'),
  accountController.getAllAccounts,
);

/**
 * @swagger
 * /api/accounts/user/{userId}:
 *   get:
 *     summary: Get user accounts
 *     description: Get all accounts for a specific user
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User accounts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/user/:userId', authenticate, accountController.getUserAccounts);

/**
 * @swagger
 * /api/accounts/{accountId}:
 *   get:
 *     summary: Get account details
 *     description: Retrieve details of a specific account
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 */
router.get('/:accountId', authenticate, accountController.getAccountById);

/**
 * @swagger
 * /api/accounts/user/{userId}:
 *   post:
 *     summary: Create new account
 *     description: Create a new bank account for a user. Minimum initial balance is 1000. User cannot have multiple accounts of the same type.
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [savings, checking, investment]
 *                 default: savings
 *                 description: Account type - user cannot have multiple accounts of same type
 *               currency:
 *                 type: string
 *                 example: USD
 *               initialBalance:
 *                 type: number
 *                 minimum: 1000
 *                 example: 1000
 *                 description: Minimum initial balance is 1000
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid input (e.g., initialBalance < 1000, duplicate account type)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.post(
  '/user/:userId',
  authenticate,
  validate(createAccountSchema),
  accountController.createAccount,
);

/**
 * @swagger
 * /api/accounts/{accountId}:
 *   put:
 *     summary: Update account
 *     description: Update account details
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [savings, checking, investment]
 *               currency:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 */
router.put(
  '/:accountId',
  authenticate,
  validate(updateAccountSchema),
  accountController.updateAccount,
);

/**
 * @swagger
 * /api/accounts/{accountId}:
 *   delete:
 *     summary: Delete account
 *     description: Delete a bank account (only if balance is zero)
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 *       400:
 *         description: Cannot delete account with non-zero balance
 */
router.delete('/:accountId', authenticate, accountController.deleteAccount);

export default router;
