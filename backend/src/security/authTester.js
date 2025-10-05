const axios = require('axios');
const jwt = require('jsonwebtoken');

class AuthenticationTester {
  constructor(baseURL = 'http://localhost:5000/api/v1') {
    this.baseURL = baseURL;
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }

  async runTest(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      const result = await testFn();
      this.testResults.tests.push({
        name,
        status: 'PASS',
        message: result.message || 'Test passed',
        details: result.details
      });
      this.testResults.summary.passed++;
    } catch (error) {
      this.testResults.tests.push({
        name,
        status: 'FAIL',
        message: error.message,
        details: error.details
      });
      this.testResults.summary.failed++;
    }
    this.testResults.summary.total++;
  }

  async testRegistration() {
    return this.runTest('User Registration', async () => {
      const testUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
        role: 'staff'
      };

      const response = await axios.post(`${this.baseURL}/auth/register`, testUser);
      
      if (response.status !== 201) {
        throw new Error(`Expected 201, got ${response.status}`);
      }

      if (!response.data.token) {
        throw new Error('No token returned');
      }

      return {
        message: 'Registration successful',
        details: { userId: response.data.user?.userId }
      };
    });
  }

  async testLogin() {
    return this.runTest('User Login', async () => {
      // First register a user
      const testUser = {
        name: 'Login Test User',
        email: `login${Date.now()}@example.com`,
        password: 'TestPassword123!',
        role: 'staff'
      };

      await axios.post(`${this.baseURL}/auth/register`, testUser);

      // Then try to login
      const loginResponse = await axios.post(`${this.baseURL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });

      if (loginResponse.status !== 200) {
        throw new Error(`Expected 200, got ${loginResponse.status}`);
      }

      if (!loginResponse.data.token) {
        throw new Error('No token returned on login');
      }

      return {
        message: 'Login successful',
        details: { token: loginResponse.data.token.substring(0, 20) + '...' }
      };
    });
  }

  async testInvalidCredentials() {
    return this.runTest('Invalid Credentials Rejection', async () => {
      try {
        await axios.post(`${this.baseURL}/auth/login`, {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });
        throw new Error('Login should have failed');
      } catch (error) {
        if (error.response?.status === 401) {
          return { message: 'Invalid credentials properly rejected' };
        }
        throw error;
      }
    });
  }

  async testJWTValidation() {
    return this.runTest('JWT Token Validation', async () => {
      // Test with invalid token
      try {
        await axios.get(`${this.baseURL}/users/profile`, {
          headers: { Authorization: 'Bearer invalid-token' }
        });
        throw new Error('Invalid token should be rejected');
      } catch (error) {
        if (error.response?.status === 401) {
          return { message: 'Invalid JWT properly rejected' };
        }
        throw error;
      }
    });
  }

  async testProtectedEndpoint() {
    return this.runTest('Protected Endpoint Access', async () => {
      // Try accessing protected endpoint without token
      try {
        await axios.get(`${this.baseURL}/users/profile`);
        throw new Error('Protected endpoint should require authentication');
      } catch (error) {
        if (error.response?.status === 401) {
          return { message: 'Protected endpoint properly secured' };
        }
        throw error;
      }
    });
  }

  async testRateLimiting() {
    return this.runTest('Rate Limiting', async () => {
      const requests = [];
      const testEmail = `ratetest${Date.now()}@example.com`;

      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          axios.post(`${this.baseURL}/auth/login`, {
            email: testEmail,
            password: 'wrongpassword'
          }).catch(err => err.response)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r?.status === 429);

      if (!rateLimited) {
        throw new Error('Rate limiting not working - no 429 responses');
      }

      return { message: 'Rate limiting is active' };
    });
  }

  async testPasswordStrength() {
    return this.runTest('Password Strength Validation', async () => {
      const weakPasswords = ['123', 'password', 'abc'];
      
      for (const password of weakPasswords) {
        try {
          await axios.post(`${this.baseURL}/auth/register`, {
            name: 'Test User',
            email: `weak${Date.now()}@example.com`,
            password,
            role: 'staff'
          });
          throw new Error(`Weak password "${password}" was accepted`);
        } catch (error) {
          if (error.response?.status !== 400) {
            throw new Error(`Expected 400 for weak password, got ${error.response?.status}`);
          }
        }
      }

      return { message: 'Password strength validation working' };
    });
  }

  async testSessionExpiry() {
    return this.runTest('JWT Expiry Validation', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: 'test_user', orgId: 'test' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      try {
        await axios.get(`${this.baseURL}/users/profile`, {
          headers: { Authorization: `Bearer ${expiredToken}` }
        });
        throw new Error('Expired token should be rejected');
      } catch (error) {
        if (error.response?.status === 401) {
          return { message: 'Expired JWT properly rejected' };
        }
        throw error;
      }
    });
  }

  async testCORSHeaders() {
    return this.runTest('CORS Headers', async () => {
      try {
        const response = await axios.options(`${this.baseURL}/auth/login`);
        const corsHeader = response.headers['access-control-allow-origin'];
        
        if (!corsHeader) {
          throw new Error('CORS headers not present');
        }

        return {
          message: 'CORS headers configured',
          details: { origin: corsHeader }
        };
      } catch (error) {
        // OPTIONS might not be implemented, check with GET
        const response = await axios.get(`${this.baseURL}/health`);
        const corsHeader = response.headers['access-control-allow-origin'];
        
        if (corsHeader) {
          return { message: 'CORS headers present' };
        }
        
        throw new Error('CORS headers not configured');
      }
    });
  }

  async runAllTests() {
    console.log('🔐 Starting Authentication Flow Tests...\n');

    await this.testRegistration();
    await this.testLogin();
    await this.testInvalidCredentials();
    await this.testJWTValidation();
    await this.testProtectedEndpoint();
    await this.testRateLimiting();
    await this.testPasswordStrength();
    await this.testSessionExpiry();
    await this.testCORSHeaders();

    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`❌ Failed: ${this.testResults.summary.failed}`);
    console.log(`📋 Total: ${this.testResults.summary.total}`);

    return this.testResults;
  }
}

module.exports = AuthenticationTester;