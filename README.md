# Express API Skeleton

A clean, structured, and production-ready skeleton for building Express APIs with TypeScript, Prisma ORM, and Zod validation.

## Project Structure

```
├── src/
│   ├── config/              # Configuration files (env, database, auth)
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Custom middleware (auth, validation, error)
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic layer
│   ├── types/               # TypeScript types and interfaces
│   ├── utils/               # Utility functions
│   ├── zod-schema/          # Zod validation schemas
│   └── main.ts              # Application entry point
├── prisma/
│   └── schema.prisma        # Prisma database schema
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment variables template
└── .gitignore              # Git ignore rules
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (or update Prisma datasource)

### Installation

1. **Clone or copy this skeleton**

   ```bash
   cp -r bank-transaction-system-skeleton my-new-api
   cd my-new-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**

   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Server will run on `http://localhost:3000`

## Available Scripts

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start development server with hot reload |
| `npm start`               | Start production server                  |
| `npm run build`           | Build TypeScript to JavaScript           |
| `npm run prisma:migrate`  | Run database migrations                  |
| `npm run prisma:generate` | Generate Prisma client                   |
| `npm run prisma:studio`   | Open Prisma Studio GUI                   |
| `npm run lint`            | Run ESLint                               |

## Architecture

### Layers

**Middleware Layer** → **Routes** → **Controllers** → **Services** → **Database**

- **Middleware**: Request processing, authentication, validation
- **Routes**: API endpoint definitions with Swagger docs
- **Controllers**: Request/response handling
- **Services**: Business logic and data operations
- **Database**: Prisma ORM for data persistence

### Key Patterns

1. **Error Handling**: Custom `AppError` class with HTTP status codes
2. **Validation**: Zod schemas for input validation
3. **Authentication**: JWT middleware (template provided)
4. **Async/Await**: Proper error propagation with try-catch
5. **Environment Config**: Centralized configuration management

## Creating New Features

### 1. Define Database Schema

Edit `prisma/schema.prisma`:

```prisma
model User {
  id    String  @id @default(cuid())
  email String  @unique
  name  String
  createdAt DateTime @default(now())
}
```

Run migration:

```bash
npm run prisma:migrate
```

### 2. Create Zod Schema

Create `src/zod-schema/user.schema.ts`:

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
});
```

### 3. Create Service

Create `src/services/user.service.ts`:

```typescript
import prisma from '../config/database.js';

export const userService = {
  async create(data: any) {
    return prisma.user.create({ data });
  },
};
```

### 4. Create Controller

Create `src/controllers/user.controller.ts`:

```typescript
import { userService } from '../services/user.service.js';

export const userController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
};
```

### 5. Create Routes

Create `src/routes/user.routes.ts`:

```typescript
import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema } from '../zod-schema/user.schema.js';

const router = Router();
router.post('/', validate(createUserSchema), userController.create);
export default router;
```

### 6. Register Routes

Update `src/main.ts`:

```typescript
import userRoutes from './routes/user.routes.js';
app.use('/api/users', userRoutes);
```

## Configuration

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydata
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

## Security Features

- Helmet.js for HTTP headers security
- CORS with configurable origins
- Input validation with Zod
- Error handling without exposing stack traces
- Environment variable management with dotenv
- JWT middleware template

## Dependencies

- **express**: Web framework
- **prisma**: ORM
- **zod**: Data validation
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **morgan**: HTTP logging
- **typescript**: Static typing
- **dotenv**: Environment variables

## Troubleshooting

### Database connection failed

- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify credentials and database exists

### TypeScript errors

- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` configuration

### Port already in use

- Change `PORT` in `.env` or kill existing process
- Use `lsof -i :3000` to find process on port 3000

## Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## License

ISC

## Author

ALHADJI OUMATE

---

**Happy coding!** 🎉
