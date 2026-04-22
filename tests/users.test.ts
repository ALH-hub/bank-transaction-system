import { expect } from 'chai';
import request from 'supertest';
import app from '../src/main.js';
import './setup.js';

describe('User Routes', () => {
  let adminToken: string;
  let adminId: string;
  let customerToken: string;
  let customerId: string;

  const adminData = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '+1111111111',
    password: 'AdminPassword123',
    role: 'ADMIN',
  };

  const customerData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'SecurePassword123',
  };

  beforeEach(async () => {
    // Register admin
    let res = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = res.body.data.accessToken;
    adminId = res.body.data.user.id;

    // Register customer
    res = await request(app)
      .post('/api/auth/register')
      .send(customerData);

    customerToken = res.body.data.accessToken;
    customerId = res.body.data.user.id;
  });

  describe('GET /api/users', () => {
    it('should allow admin to view all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);
    });

    it('should deny customer access to view all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(403);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.status).to.equal(401);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('pagination');
    });
  });

  describe('GET /api/users/{userId}', () => {
    it('should allow user to view their own profile', async () => {
      const res = await request(app)
        .get(`/api/users/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.id).to.equal(customerId);
      expect(res.body.data.email).to.equal(customerData.email);
    });

    it('should allow admin to view any user', async () => {
      const res = await request(app)
        .get(`/api/users/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.id).to.equal(customerId);
    });

    it('should deny customer access to other users', async () => {
      // Register another customer
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '+0987654321',
          password: 'SecurePassword456',
        });

      const otherUserId = res1.body.data.user.id;

      const res = await request(app)
        .get(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(403);
    });

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /api/users/{userId}', () => {
    it('should allow user to update their own profile', async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'UpdatedName',
          lastName: 'UpdatedSurname',
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.firstName).to.equal('UpdatedName');
    });

    it('should allow admin to update any user', async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'AdminUpdated',
        });

      expect(res.status).to.equal(200);
      expect(res.body.data.firstName).to.equal('AdminUpdated');
    });

    it('should deny customer updating other users', async () => {
      const res = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'Hacked',
        });

      expect(res.status).to.equal(403);
    });
  });

  describe('DELETE /api/users/{userId}', () => {
    it('should only allow admin to delete users', async () => {
      const res = await request(app)
        .delete(`/api/users/${customerId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(403);
    });

    it('should allow admin to delete users', async () => {
      const res = await request(app)
        .delete(`/api/users/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
    });

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/users/{userId}/activate', () => {
    it('should only allow admin to activate users', async () => {
      const res = await request(app)
        .post(`/api/users/${customerId}/activate`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(403);
    });

    it('should allow admin to activate users', async () => {
      // First deactivate
      await request(app)
        .post(`/api/users/${customerId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Then activate
      const res = await request(app)
        .post(`/api/users/${customerId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.isActive).to.equal(true);
    });
  });

  describe('POST /api/users/{userId}/deactivate', () => {
    it('should only allow admin to deactivate users', async () => {
      const res = await request(app)
        .post(`/api/users/${customerId}/deactivate`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(403);
    });

    it('should allow admin to deactivate users', async () => {
      const res = await request(app)
        .post(`/api/users/${customerId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.isActive).to.equal(false);
    });
  });

  describe('PUT /api/users/{userId}/role', () => {
    it('should only allow admin to change roles', async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}/role`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ role: 'TELLER' });

      expect(res.status).to.equal(403);
    });

    it('should allow admin to change user roles', async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'TELLER' });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.role).to.equal('TELLER');
    });

    it('should validate role values', async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'INVALID_ROLE' });

      expect(res.status).to.equal(400);
    });
  });
});
