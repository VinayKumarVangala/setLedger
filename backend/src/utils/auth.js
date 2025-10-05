const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class AuthUtils {
  // Generate unique organization ID
  static generateOrgID() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORG${timestamp}${random}`.toUpperCase();
  }

  // Generate unique member ID within organization
  static generateMemberID(existingCount = 0) {
    const memberNum = (existingCount + 1).toString().padStart(3, '0');
    return `USR${memberNum}`;
  }

  // Generate userID in orgID_memberID format
  static generateUserID(orgID, memberID) {
    return `${orgID}_${memberID}`;
  }

  // Hash password with bcrypt
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT tokens
  static generateTokens(payload) {
    const envConfig = require('../config/env');
    const accessToken = jwt.sign(payload, envConfig.jwt.secret, {
      expiresIn: envConfig.jwt.expiresIn
    });

    const refreshToken = jwt.sign(payload, envConfig.jwt.refreshSecret, {
      expiresIn: envConfig.jwt.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  static verifyToken(token, isRefresh = false) {
    const envConfig = require('../config/env');
    const secret = isRefresh ? envConfig.jwt.refreshSecret : envConfig.jwt.secret;
    return jwt.verify(token, secret);
  }

  // Generate TOTP secret
  static generateTOTPSecret(userEmail, orgName) {
    const envConfig = require('../config/env');
    return speakeasy.generateSecret({
      name: `${userEmail} (${orgName})`,
      issuer: envConfig.totp.issuer,
      length: 32
    });
  }

  // Generate QR code for TOTP setup
  static async generateTOTPQR(secret) {
    return await QRCode.toDataURL(secret.otpauth_url);
  }

  // Verify TOTP token
  static verifyTOTP(token, secret) {
    const envConfig = require('../config/env');
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: envConfig.totp.window
    });
  }

  // Generate backup codes
  static generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }

  // Generate invitation token
  static generateInvitationToken(payload) {
    const envConfig = require('../config/env');
    return jwt.sign(payload, envConfig.jwt.secret, {
      expiresIn: '7d'
    });
  }

  // Verify invitation token
  static verifyInvitationToken(token) {
    const envConfig = require('../config/env');
    return jwt.verify(token, envConfig.jwt.secret);
  }

  // Validate password strength
  static validatePassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      errors: [
        ...(password.length < minLength ? ['Password must be at least 8 characters'] : []),
        ...(!hasUpper ? ['Password must contain uppercase letter'] : []),
        ...(!hasLower ? ['Password must contain lowercase letter'] : []),
        ...(!hasNumber ? ['Password must contain number'] : []),
        ...(!hasSpecial ? ['Password must contain special character'] : [])
      ]
    };
  }
}

module.exports = AuthUtils;