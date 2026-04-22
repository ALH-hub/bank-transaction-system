import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';
import './setup.js';

const app = createApp();

describe('Transaction Routes', () => {
  let accessToken: string;
  let userId: string;
  let accountId: string;
  let receiverUserId: string;
  let receiverAccountId: string;

  const userData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'SecurePassword123',
  };

  const receiverData = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    password: 'SecurePassword456',
  };

  beforeEach(async () => {
    // Register sender
    let res = await request(app).post('/api/auth/register').send(userData);

    accessToken = res.body.data.accessToken;
    userId = res.body.data.user.id;

    // Create account for sender
    res = await request(app)
      .post(`/api/accounts/user/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        accountType: 'savings',
        currency: 'USD',
        initialBalance: 5000,
      });

    accountId = res.body.data.id;

    // Register receiver
    res = await request(app).post('/api/auth/register').send(receiverData);

    receiverUserId = res.body.data.user.id;
    const receiverToken = res.body.data.accessToken;

    // Create account for receiver
    res = await request(app)
      .post(`/api/accounts/user/${receiverUserId}`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .send({
        accountType: 'savings',
        currency: 'USD',
        initialBalance: 2000,
      });

    receiverAccountId = res.body.data.id;
  });

  describe('POST /api/transactions/deposit', () => {
    it('should deposit successfully with minimum amount 100', async () => {
      const res = await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 100,
          description: 'Test deposit',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.amount).to.equal(100);
      expect(res.body.data.type).to.equal('DEPOSIT');
      expect(res.body.data.status).to.equal('COMPLETED');
    });

    it('should fail with deposit less than 100', async () => {
      const res = await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 50,
          description: 'Test deposit',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });

    it('should update account balance on deposit', async () => {
      const initialBalanceRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const initialBalance = initialBalanceRes.body.data.balance;

      await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 500,
        });

      const updatedBalanceRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const updatedBalance = updatedBalanceRes.body.data.balance;
      expect(updatedBalance).to.equal(initialBalance + 500);
    });

    it('should fail on non-existent account', async () => {
      const res = await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId: 'cmo8gzd720303fqf20sgldaz2',
          amount: 100,
        });

      expect(res.status).to.equal(404);
    });

    it('should fail on inactive account', async () => {
      // Deactivate account
      await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          isActive: false,
        });

      const res = await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 100,
        });

      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/transactions/withdraw', () => {
    it('should withdraw successfully with minimum amount 100', async () => {
      const res = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 100,
          description: 'Test withdrawal',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.amount).to.equal(100);
      expect(res.body.data.type).to.equal('WITHDRAWAL');
    });

    it('should fail with withdrawal less than 100', async () => {
      const res = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 50,
          description: 'Test withdrawal',
        });

      expect(res.status).to.equal(400);
    });

    it('should fail with insufficient balance', async () => {
      const res = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 10000,
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Insufficient balance');
    });

    it('should update account balance on withdrawal', async () => {
      const initialBalanceRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const initialBalance = initialBalanceRes.body.data.balance;

      await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 500,
        });

      const updatedBalanceRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const updatedBalance = updatedBalanceRes.body.data.balance;
      expect(updatedBalance).to.equal(initialBalance - 500);
    });

    it('should fail on non-existent account', async () => {
      const res = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId: 'cmo8gzd720303fqf20sgldaz2',
          amount: 100,
        });

      expect(res.status).to.equal(404);
    });

    it('should only allow account owner to withdraw', async () => {
      const receiverToken = (
        await request(app).post('/api/auth/login').send({
          email: receiverData.email,
          password: receiverData.password,
        })
      ).body.data.accessToken;

      const res = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({
          accountId, // Try to withdraw from someone else's account
          amount: 100,
        });

      expect(res.status).to.equal(403);
    });
  });

  describe('POST /api/transactions/transfer', () => {
    it('should transfer successfully', async () => {
      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fromAccountId: accountId,
          toAccountId: receiverAccountId,
          amount: 500,
          description: 'Test transfer',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.type).to.equal('TRANSFER');
      expect(res.body.data.amount).to.equal(500);
    });

    it('should fail with insufficient balance', async () => {
      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fromAccountId: accountId,
          toAccountId: receiverAccountId,
          amount: 10000,
        });

      expect(res.status).to.equal(400);
    });

    it('should fail transferring to same account', async () => {
      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fromAccountId: accountId,
          toAccountId: accountId,
          amount: 100,
        });

      expect(res.status).to.equal(400);
    });

    it('should update both account balances', async () => {
      const senderInitialRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const receiverToken = (
        await request(app).post('/api/auth/login').send({
          email: receiverData.email,
          password: receiverData.password,
        })
      ).body.data.accessToken;

      const receiverInitialRes = await request(app)
        .get(`/api/accounts/${receiverAccountId}`)
        .set('Authorization', `Bearer ${receiverToken}`);

      const senderInitialBalance = senderInitialRes.body.data.balance;
      const receiverInitialBalance = receiverInitialRes.body.data.balance;
      const transferAmount = 500;

      await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fromAccountId: accountId,
          toAccountId: receiverAccountId,
          amount: transferAmount,
        });

      const senderUpdatedRes = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const receiverUpdatedRes = await request(app)
        .get(`/api/accounts/${receiverAccountId}`)
        .set('Authorization', `Bearer ${receiverToken}`);

      expect(senderUpdatedRes.body.data.balance).to.equal(
        senderInitialBalance - transferAmount,
      );
      expect(receiverUpdatedRes.body.data.balance).to.equal(
        receiverInitialBalance + transferAmount,
      );
    });

    it('should fail if from account is not owned by user', async () => {
      const receiverToken = (
        await request(app).post('/api/auth/login').send({
          email: receiverData.email,
          password: receiverData.password,
        })
      ).body.data.accessToken;

      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({
          fromAccountId: accountId, // Try to transfer from someone else's account
          toAccountId: receiverAccountId,
          amount: 100,
        });

      expect(res.status).to.equal(403);
    });
  });

  describe('GET /api/transactions/account/{accountId}', () => {
    beforeEach(async () => {
      // Create some transactions
      await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 500,
        });

      await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          amount: 200,
        });
    });

    it('should get account transactions', async () => {
      const res = await request(app)
        .get(`/api/transactions/account/${accountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.equal(2);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get(`/api/transactions/account/${accountId}?page=1&limit=10`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('pagination');
    });
  });

  describe('GET /api/transactions', () => {
    it('should only allow admin and teller to view all transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).to.equal(403); // Customer cannot view all transactions
    });
  });
});
