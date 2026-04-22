import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';
import './setup.js';

const app = createApp();

describe('Authentication Routes', () => {
  const validRegisterData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'SecurePassword123',
  };

  const validLoginData = {
    email: 'john@example.com',
    password: 'SecurePassword123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('user');
      expect(res.body.data).to.have.property('accessToken');
      expect(res.body.data).to.have.property('refreshToken');
      expect(res.body.data.user.email).to.equal(validRegisterData.email);
    });

    it('should fail with duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      expect(res.status).to.equal(409);
      expect(res.body.success).to.equal(false);
    });

    it('should fail with duplicate phone', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          email: 'different@example.com',
        });

      expect(res.status).to.equal(409);
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          email: 'invalid-email',
        });

      expect(res.status).to.equal(400);
    });

    it('should fail with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegisterData,
          password: '123',
        });

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('accessToken');
      expect(res.body.data).to.have.property('refreshToken');
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123',
        });

      expect(res.status).to.equal(401);
      expect(res.body.success).to.equal(false);
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validLoginData.email,
          password: 'WrongPassword123',
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      refreshToken = res.body.data.refreshToken;
    });

    it('should refresh access token successfully', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('accessToken');
      expect(res.body.data.refreshToken).to.equal(refreshToken);
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).to.equal(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      refreshToken = res.body.data.refreshToken;
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).to.equal(401);
    });
  });
});
