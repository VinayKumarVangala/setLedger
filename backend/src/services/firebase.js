const admin = require('firebase-admin');

class FirebaseService {
  constructor() {
    if (!admin.apps.length) {
      const envConfig = require('../config/env');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: envConfig.firebase.projectId,
          privateKey: envConfig.firebase.privateKey,
          clientEmail: envConfig.firebase.clientEmail
        }),
        databaseURL: envConfig.firebase.databaseURL
      });
    }
    this.auth = admin.auth();
  }

  // Send email OTP via Firebase
  async sendEmailOTP(email) {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      // Store OTP in memory (in production, use Redis)
      if (!this.otpStore) this.otpStore = new Map();
      this.otpStore.set(email, { otp, expiresAt, attempts: 0 });
      
      // Clean up expired OTPs
      this.cleanupExpiredOTPs();
      
      // In production, send actual email via SendGrid/Mailgun
      console.log(`Email OTP for ${email}: ${otp}`);
      
      return {
        success: true,
        message: 'OTP sent to email',
        expiresIn: 300 // 5 minutes
      };
    } catch (error) {
      throw new Error(`Failed to send email OTP: ${error.message}`);
    }
  }

  // Verify email OTP
  async verifyEmailOTP(email, otp) {
    try {
      if (!this.otpStore || !this.otpStore.has(email)) {
        throw new Error('OTP not found or expired');
      }
      
      const otpData = this.otpStore.get(email);
      
      // Check expiration
      if (new Date() > otpData.expiresAt) {
        this.otpStore.delete(email);
        throw new Error('OTP expired');
      }
      
      // Check attempts
      if (otpData.attempts >= 3) {
        this.otpStore.delete(email);
        throw new Error('Too many failed attempts');
      }
      
      // Verify OTP
      if (otpData.otp !== otp) {
        otpData.attempts++;
        throw new Error('Invalid OTP');
      }
      
      // OTP verified, remove from store
      this.otpStore.delete(email);
      
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      throw new Error(`Failed to verify email OTP: ${error.message}`);
    }
  }
  
  // Clean up expired OTPs
  cleanupExpiredOTPs() {
    if (!this.otpStore) return;
    
    const now = new Date();
    for (const [email, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(email);
      }
    }
  }

  // Create Firebase user for backup authentication
  async createFirebaseUser(email, password) {
    try {
      const userRecord = await this.auth.createUser({
        email: email,
        password: password,
        emailVerified: false
      });
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to create Firebase user: ${error.message}`);
    }
  }

  // Verify Firebase ID token
  async verifyIdToken(idToken) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error(`Failed to verify Firebase token: ${error.message}`);
    }
  }
}

module.exports = new FirebaseService();