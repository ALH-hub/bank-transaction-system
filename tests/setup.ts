import prisma from '../src/config/database.js';
import {after, afterEach, before, beforeEach} from 'mocha';

// Global test setup
export const setupTests = async () => {
  try {
    await prisma.$connect();
    console.log('Test database connected');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    process.exit(1);
  }
};

// Global test teardown
export const teardownTests = async () => {
  try {
    await prisma.$disconnect();
    console.log('Test database disconnected');
  } catch (error) {
    console.error('Failed to disconnect from test database:', error);
  }
};

// Clean database tables
export const cleanDatabase = async () => {
  try {
    // Delete in order of dependencies
    await prisma.transaction.deleteMany();
    await prisma.token.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Failed to clean database:', error);
  }
};

// Before all tests
before(async function () {
  this.timeout(10000);
  await setupTests();
  await cleanDatabase();
});

// After all tests
after(async function () {
  this.timeout(10000);
  await cleanDatabase();
  await teardownTests();
});

// Before each test
beforeEach(async function () {
  await cleanDatabase();
});
