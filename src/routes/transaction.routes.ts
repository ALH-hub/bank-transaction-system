import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  depositSchema,
  withdrawSchema,
  transferSchema,
} from '../zod-schema/auth-account.schema.js';

const router = Router();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions (Admin/Teller only)
 *     description: Retrieve all transactions in the system
 *     tags:
 *       - Transactions
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
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only Admin/Teller can view all transactions
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'TELLER'),
  transactionController.getAllTransactions,
);

/**
 * @swagger
 * /api/transactions/account/{accountId}:
 *   get:
 *     summary: Get account transactions
 *     description: Retrieve all transactions for a specific account
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
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
 *         description: Account transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/account/:accountId',
  authenticate,
  transactionController.getAccountTransactions,
);

/**
 * @swagger
 * /api/transactions/reference/{reference}:
 *   get:
 *     summary: Get transaction by reference
 *     description: Retrieve details of a specific transaction by reference number
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 */
router.get(
  '/reference/:reference',
  authenticate,
  transactionController.getTransactionByReference,
);

/**
 * @swagger
 * /api/transactions/deposit:
 *   post:
 *     summary: Deposit money to account
 *     description: Make a deposit to a bank account
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               description:
 *                 type: string
 *                 example: Monthly salary deposit
 *     responses:
 *       201:
 *         description: Deposit successful
 *       400:
 *         description: Invalid amount or account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 */
router.post(
  '/deposit',
  authenticate,
  validate(depositSchema),
  transactionController.deposit,
);

/**
 * @swagger
 * /api/transactions/withdraw:
 *   post:
 *     summary: Withdraw money from account
 *     description: Make a withdrawal from a bank account
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 200.00
 *               description:
 *                 type: string
 *                 example: ATM withdrawal
 *     responses:
 *       201:
 *         description: Withdrawal successful
 *       400:
 *         description: Invalid amount, insufficient balance, or account inactive
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not account owner
 *       404:
 *         description: Account not found
 */
router.post(
  '/withdraw',
  authenticate,
  validate(withdrawSchema),
  transactionController.withdraw,
);

/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     summary: Transfer money between accounts
 *     description: Transfer money from one account to another
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccountId
 *               - toAccountId
 *               - amount
 *             properties:
 *               fromAccountId:
 *                 type: string
 *               toAccountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 1000.00
 *               description:
 *                 type: string
 *                 example: Payment to contractor
 *     responses:
 *       201:
 *         description: Transfer successful
 *       400:
 *         description: Invalid amount, insufficient balance, or accounts invalid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not account owner
 *       404:
 *         description: Account not found
 */
router.post(
  '/transfer',
  authenticate,
  validate(transferSchema),
  transactionController.transfer,
);

export default router;
