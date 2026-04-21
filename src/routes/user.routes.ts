import { Router, type Router as ExpressRouter } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createUserSchema } from '../zod-schema/index.js';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin/Teller only)
 *     description: Retrieve a list of all bank users
 *     tags:
 *       - Users Management
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
 *         description: List of users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only Admin/Teller
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'TELLER'),
  userController.getAllUsers,
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user's information
 *     tags:
 *       - Users Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, userController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     description: Create a new user account
 *     tags:
 *       - Users Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, CUSTOMER, TELLER]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only Admin
 *       409:
 *         description: Email or phone already exists
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createUserSchema),
  userController.createUser,
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user information
 *     tags:
 *       - Users Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/:id', authenticate, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: Delete a user account
 *     tags:
 *       - Users Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only Admin
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  userController.deleteUser,
);

/**
 * @swagger
 * /api/users/{id}/activate:
 *   put:
 *     summary: Activate user (Admin only)
 *     description: Activate a deactivated user account
 *     tags:
 *       - Users Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only Admin
 *       404:
 *         description: User not found
 */
router.put(
  '/:id/activate',
  authenticate,
  authorize('ADMIN'),
  userController.activateUser,
);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   put:
 *     summary: Deactivate user (Admin only)
 *     description: Deactivate a user account
 *     tags:
 *       - Users Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only Admin
 *       404:
 *         description: User not found
 */
router.put(
  '/:id/deactivate',
  authenticate,
  authorize('ADMIN'),
  userController.deactivateUser,
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     description: Change a user's role (ADMIN, CUSTOMER, TELLER)
 *     tags:
 *       - Users Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, CUSTOMER, TELLER]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only Admin
 *       404:
 *         description: User not found
 */
router.put(
  '/:id/role',
  authenticate,
  authorize('ADMIN'),
  userController.updateUserRole,
);

export default router;
