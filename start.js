#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting setLedger Application...\n');

// Start backend
console.log('📡 Starting Backend Server...');
const backend = spawn('node', ['src/server-simple.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment for backend to start
setTimeout(() => {
  console.log('🎨 Starting Frontend Server...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend exited with code ${code}`);
    backend.kill('SIGINT');
  });

  backend.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
    frontend.kill('SIGINT');
  });

}, 2000);

backend.on('close', (code) => {
  if (code !== 0) {
    console.log(`Backend process exited with code ${code}`);
  }
});