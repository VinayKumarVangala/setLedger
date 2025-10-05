const request = require('supertest');
const app = require('../src/server');
const { User, Organization } = require('../src/models');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new organization successfully', async () => {
      const registerData = {
        organizationName: 'Test Corp',
        adminEmail: 'admin@test.com',
        adminName: 'Test Admin',
        password: 'SecurePass123!',
        phone: '+1234567890',
        businessType: 'service'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organization.name).toBe('Test Corp');
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.tokens).toBeDefined();
    });

    it('should reject weak password', async () => {
      const registerData = {
        organizationName: 'Test Corp',
        adminEmail: 'admin@test.com',
        adminName: 'Test Admin',
        password: 'weak',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      const registerData = {
        organizationName: 'Test Corp',
        adminEmail: 'admin@test.com',
        adminName: 'Test Admin',
        password: 'SecurePass123!',
        phone: '+1234567890'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('admin@test.com');
      expect(response.body.data.tokens).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});