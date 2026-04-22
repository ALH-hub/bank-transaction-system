import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';
import './setup.js';

const app = createApp();

describe('Account Routes', () => {
  let accessToken: string;
  let userId: string;
  let accountId: string;

  const userData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'SecurePassword123',
  };

  beforeEach(async () => {
    // Register and login
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    accessToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;
  });

  describe('POST /api/accounts/user/{userId}', () => {
    it('should create account with minimum initial balance 1000', async () => {
      const res = await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 1000,
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('accountNumber');
      expect(res.body.data.balance).to.equal(1000);
      expect(res.body.data.accountType).to.equal('savings');
      accountId = res.body.data.id;
    });

    it('should fail with initial balance less than 1000', async () => {
      const res = await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 500,
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });

    it('should prevent duplicate account types for user', async () => {
      // Create first savings account
      await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 1000,
        });

      // Try to create second savings account
      const res = await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 1000,
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });

    it('should allow different account types', async () => {
      // Create savings account
      await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 1000,
        });

      // Create checking account
      const res = await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'checking',
          currency: 'USD',
          initialBalance: 1500,
        });

      expect(res.status).to.equal(201);
      expect(res.body.data.accountType).to.equal('checking');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post(`/api/accounts/user/${userId}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 1000,
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/accounts/user/{userId}', () => {
    beforeEach(async () => {
      // Create an account
      const res = await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 1000,
        });

      accountId = res.body.data.id;
    });

    it('should get user accounts successfully', async () => {
      const res = await request(app)
        .get(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);
      expect(res.body.data[0]).to.have.property('accountNumber');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get(`/api/accounts/user/${userId}?page=1&limit=10`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('pagination');
      expect(res.body.pagination).to.have.property('page');
      expect(res.body.pagination).to.have.property('limit');
    });
  });

  describe('GET /api/accounts/{accountId}', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 1000,
        });

      accountId = res.body.data.id;
    });

    it('should get account by id', async () => {
      const res = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.id).to.equal(accountId);
      expect(res.body.data).to.have.property('balance');
    });

    it('should fail with invalid account id', async () => {
      const res = await request(app)
        .get('/api/accounts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('DELETE /api/accounts/{accountId}', () => {
    it('should delete account with zero balance', async () => {
      // Create account with 1000
      const createRes = await request(app)
        .post(`/api/accounts/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountType: 'savings',
          currency: 'USD',
          initialBalance: 1000,
        });

      accountId = createRes.body.data.id;

      // Should fail to delete with non-zero balance
      let deleteRes = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).to.equal(400);

      // Withdraw all funds
      await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 1000,
        });

      // Now delete should succeed
      deleteRes = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).to.equal(200);
    });
  });
});
