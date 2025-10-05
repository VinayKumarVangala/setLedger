#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting setLedger Complete Suite...\n');

// Start backend (simple version)
const backend = spawn('npm', ['run', 'dev:simple'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// Skip AI service for now (optional)
console.log('⚠️  AI service skipped (optional - requires Python setup)');

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

console.log('✅ All services started!');
console.log('📱 Frontend: http://localhost:3000');
console.log('🔧 Backend: http://localhost:5000');
console.log('🤖 AI Service: http://localhost:5001 (if available)');