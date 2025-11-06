const crypto = require('crypto');
const fetch = require('node-fetch');

// Atomic counters with mutex-like behavior
class AtomicCounter {
  constructor(start = 1000) {
    this.value = start;
    this.lock = false;
  }
  
  async getNext() {
    while (this.lock) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    this.lock = true;
    const result = this.value++;
    this.lock = false;
    return result;
  }
}

// Thread-safe ID generators
const orgCounter = new AtomicCounter(1000);
const userCounters = new Map();
const sessionStore = new Set();

const generateSecureOrgId = async () => {
  const sequence = await orgCounter.getNext();
  return `ORG${sequence}`;
};

const generateSecureUserId = async (orgId) => {
  if (!userCounters.has(orgId)) {
    userCounters.set(orgId, new AtomicCounter(1));
  }
  const sequence = await userCounters.get(orgId).getNext();
  return `${orgId}-${sequence}`;
};

const generateCSRFToken = () => crypto.randomBytes(32).toString('hex');

// Concurrent signup simulation
const simulateConcurrentSignups = async (count = 1000) => {
  console.log(`🚀 Starting ${count} concurrent signups...`);
  
  const signupPromises = Array.from({ length: count }, async (_, i) => {
    const userData = {
      name: `User${i}`,
      email: `user${i}@test.com`,
      password: `password${i}`,
      orgName: `Org${i}`,
      csrfToken: generateCSRFToken()
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': userData.csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        const { user, organization } = result.data;
        
        // Validate unique IDs
        if (sessionStore.has(user.displayId)) {
          throw new Error(`Duplicate user ID: ${user.displayId}`);
        }
        sessionStore.add(user.displayId);
        
        return {
          success: true,
          userId: user.displayId,
          orgId: organization.displayId,
          uuid: user.uuid
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  const results = await Promise.all(signupPromises);
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const uniqueUserIds = new Set(successful.map(r => r.userId));
  const uniqueOrgIds = new Set(successful.map(r => r.orgId));
  const uniqueUUIDs = new Set(successful.map(r => r.uuid));
  
  console.log(`✅ Successful signups: ${successful.length}`);
  console.log(`❌ Failed signups: ${failed.length}`);
  console.log(`🔑 Unique User IDs: ${uniqueUserIds.size}`);
  console.log(`🏢 Unique Org IDs: ${uniqueOrgIds.size}`);
  console.log(`🆔 Unique UUIDs: ${uniqueUUIDs.size}`);
  
  // Validate no duplicates
  const noDuplicateIds = uniqueUserIds.size === successful.length && 
                        uniqueOrgIds.size === successful.length &&
                        uniqueUUIDs.size === successful.length;
  
  console.log(`🛡️ No duplicate IDs: ${noDuplicateIds ? '✅' : '❌'}`);
  
  return { successful, failed, noDuplicateIds };
};

// MFA validation test
const testMFAValidation = async () => {
  console.log('🔐 Testing MFA validation...');
  
  // Setup 2FA
  const setupResponse = await fetch('http://localhost:5000/api/v1/auth/setup-2fa', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  const setupData = await setupResponse.json();
  console.log(`2FA Setup: ${setupData.success ? '✅' : '❌'}`);
  
  // Test invalid token
  const invalidResponse = await fetch('http://localhost:5000/api/v1/auth/verify-2fa', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ token: '000000' })
  });
  
  const invalidData = await invalidResponse.json();
  console.log(`Invalid MFA rejected: ${!invalidData.success ? '✅' : '❌'}`);
  
  return setupData.success && !invalidData.success;
};

// XSS protection test
const testXSSProtection = async () => {
  console.log('🛡️ Testing XSS protection...');
  
  const xssPayload = '<script>alert("xss")</script>';
  const response = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: xssPayload,
      email: 'test@test.com',
      password: 'password',
      orgName: xssPayload
    })
  });
  
  const data = await response.json();
  const isProtected = !data.success || !JSON.stringify(data).includes('<script>');
  console.log(`XSS Protection: ${isProtected ? '✅' : '❌'}`);
  
  return isProtected;
};

// CSRF protection test
const testCSRFProtection = async () => {
  console.log('🔒 Testing CSRF protection...');
  
  // Request without CSRF token
  const response = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password',
      orgName: 'Test Org'
    })
  });
  
  const data = await response.json();
  const isProtected = response.status === 403 || data.error?.code === 'CSRF_TOKEN_MISSING';
  console.log(`CSRF Protection: ${isProtected ? '✅' : '❌'}`);
  
  return isProtected;
};

// Run all tests
const runSecurityTests = async () => {
  console.log('🧪 Starting Security Test Suite\n');
  
  try {
    const concurrentResults = await simulateConcurrentSignups(1000);
    const mfaValid = await testMFAValidation();
    const xssProtected = await testXSSProtection();
    const csrfProtected = await testCSRFProtection();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Concurrent Signups: ${concurrentResults.noDuplicateIds ? '✅' : '❌'}`);
    console.log(`MFA Validation: ${mfaValid ? '✅' : '❌'}`);
    console.log(`XSS Protection: ${xssProtected ? '✅' : '❌'}`);
    console.log(`CSRF Protection: ${csrfProtected ? '✅' : '❌'}`);
    
    const allPassed = concurrentResults.noDuplicateIds && mfaValid && xssProtected && csrfProtected;
    console.log(`\n🎯 Overall Security Score: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

module.exports = { runSecurityTests, simulateConcurrentSignups };

// CSRF token endpoint
app.get('/api/v1/csrf-token', (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.json({ success: true, data: { csrfToken } });
});

// Run if called directly
if (require.main === module) {
  runSecurityTests();
}