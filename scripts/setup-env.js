#!/usr/bin/env node

/**
 * Environment Setup Script
 * Generates secure environment files from templates
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const generateSecureKey = () => crypto.randomBytes(32).toString('base64');

const envTemplates = [
  { template: '.env.example', target: '.env' },
  { template: 'backend/.env.example', target: 'backend/.env' },
  { template: 'frontend/.env.example', target: 'frontend/.env' },
  { template: 'ai-service/.env.example', target: 'ai-service/.env' }
];

const secureReplacements = {
  'your-super-secure-jwt-secret-key-here': generateSecureKey(),
  'your-super-secure-jwt-secret-key-minimum-32-characters': generateSecureKey(),
  'your-super-secure-refresh-secret-key-here': generateSecureKey(),
  'your-super-secure-refresh-secret-key-minimum-32-characters': generateSecureKey(),
  'your-kms-encryption-key-for-totp': generateSecureKey(),
  'your-kms-encryption-key-for-totp-secrets': generateSecureKey()
};

console.log('🔧 Setting up secure environment files...\n');

envTemplates.forEach(({ template, target }) => {
  const templatePath = path.join(__dirname, '..', template);
  const targetPath = path.join(__dirname, '..', target);
  
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️  Template not found: ${template}`);
    return;
  }
  
  if (fs.existsSync(targetPath)) {
    console.log(`⏭️  Skipping ${target} (already exists)`);
    return;
  }
  
  let content = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholder values with secure keys
  Object.entries(secureReplacements).forEach(([placeholder, secure]) => {
    content = content.replace(new RegExp(placeholder, 'g'), secure);
  });
  
  fs.writeFileSync(targetPath, content);
  
  // Set secure permissions
  try {
    fs.chmodSync(targetPath, 0o600);
    console.log(`✅ Created ${target} with secure permissions`);
  } catch (error) {
    console.log(`✅ Created ${target} (permissions may need manual setting)`);
  }
});

console.log('\n🔒 Security Setup Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Review and update the generated .env files with your actual values');
console.log('2. Set up your database connections');
console.log('3. Add your API keys for external services');
console.log('4. Run: npm run start-all');
console.log('\n⚠️  Remember: Never commit .env files to version control!');