const AuthUtils = require('../utils/auth');
const FirebaseService = require('../services/firebase');
const { Organization, User } = require('../models');
const { ROLES, MODULE_PERMISSIONS } = require('../middleware/roles');
const Joi = require('joi');

class AuthController {
  // Organization registration
  async register(req, res) {
    try {
      // Validation schema
      const schema = Joi.object({
        organizationName: Joi.string().required().trim().min(2).max(100),
        adminEmail: Joi.string().email().required(),
        adminName: Joi.string().required().trim().min(2).max(50),
        password: Joi.string().required().min(8),
        phone: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
        businessType: Joi.string().valid('retail', 'wholesale', 'service', 'manufacturing').default('retail')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { organizationName, adminEmail, adminName, password, phone, businessType } = value;

      // Check if organization email already exists
      const existingOrg = await Organization.findOne({ email: adminEmail });
      if (existingOrg) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_RESOURCE', message: 'Organization already exists' }
        });
      }

      // Validate password strength
      const passwordValidation = AuthUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: passwordValidation.errors.join(', ') }
        });
      }

      // Generate IDs
      const orgID = AuthUtils.generateOrgID();
      const memberID = AuthUtils.generateMemberID(0);
      const userID = AuthUtils.generateUserID(orgID, memberID);

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Create organization
      const organization = new Organization({
        orgID,
        name: organizationName,
        email: adminEmail,
        phone,
        businessType,
        createdBy: userID,
        updatedBy: userID
      });

      // Create admin user with full permissions
      const adminPermissions = Object.keys(MODULE_PERMISSIONS).map(module => ({
        module,
        actions: MODULE_PERMISSIONS[module][ROLES.ADMIN]
      }));

      const user = new User({
        userID,
        orgID,
        memberID,
        name: adminName,
        email: adminEmail,
        phone,
        password: hashedPassword,
        role: ROLES.ADMIN,
        permissions: adminPermissions,
        createdBy: userID,
        updatedBy: userID
      });

      // Save to database
      await organization.save();
      await user.save();

      // Create Firebase user for backup auth
      try {
        await FirebaseService.createFirebaseUser(adminEmail, password);
      } catch (firebaseError) {
        console.warn('Firebase user creation failed:', firebaseError.message);
      }

      // Send welcome email
      try {
        const EmailService = require('../services/email');
        await EmailService.sendWelcomeEmail({
          to: adminEmail,
          organizationName,
          adminName
        });
      } catch (emailError) {
        console.warn('Welcome email failed:', emailError.message);
      }

      // Generate tokens
      const tokens = AuthUtils.generateTokens({
        userID,
        orgID,
        role: 'admin'
      });

      res.status(201).json({
        success: true,
        data: {
          organization: {
            orgID: organization.orgID,
            name: organization.name,
            email: organization.email
          },
          user: {
            userID: user.userID,
            name: user.name,
            email: user.email,
            role: user.role
          },
          tokens
        },
        message: 'Organization registered successfully'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Registration failed' }
      });
    }
  }

  // User login
  async login(req, res) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        totpCode: Joi.string().length(6).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { email, password, totpCode } = value;

      // Find user
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }

      // Check account lockout
      if (user.auth.lockedUntil && user.auth.lockedUntil > new Date()) {
        return res.status(423).json({
          success: false,
          error: { code: 'ACCOUNT_LOCKED', message: 'Account temporarily locked' }
        });
      }

      // Verify password
      const isPasswordValid = await AuthUtils.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        // Increment login attempts
        user.auth.loginAttempts += 1;
        if (user.auth.loginAttempts >= 5) {
          user.auth.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }
        await user.save();

        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }

      // Check TOTP if enabled
      if (user.auth.totpEnabled) {
        if (!totpCode) {
          return res.status(200).json({
            success: true,
            data: { requiresTOTP: true },
            message: 'TOTP code required'
          });
        }

        const isTOTPValid = AuthUtils.verifyTOTP(totpCode, user.auth.totpSecret);
        if (!isTOTPValid) {
          return res.status(401).json({
            success: false,
            error: { code: 'INVALID_TOTP', message: 'Invalid TOTP code' }
          });
        }
      }

      // Reset login attempts and update last login
      user.auth.loginAttempts = 0;
      user.auth.lockedUntil = undefined;
      user.auth.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = AuthUtils.generateTokens({
        userID: user.userID,
        orgID: user.orgID,
        role: user.role
      });

      res.json({
        success: true,
        data: {
          user: {
            userID: user.userID,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions
          },
          tokens
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Login failed' }
      });
    }
  }

  // Setup TOTP
  async setupTOTP(req, res) {
    try {
      const { userID } = req.user;

      const user = await User.findOne({ userID, isActive: true });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'User not found' }
        });
      }

      const organization = await Organization.findOne({ orgID: user.orgID });
      
      // Generate TOTP secret
      const secret = AuthUtils.generateTOTPSecret(user.email, organization.name);
      const qrCode = await AuthUtils.generateTOTPQR(secret);
      const backupCodes = AuthUtils.generateBackupCodes();

      // Save secret (not enabled yet)
      user.auth.totpSecret = secret.base32;
      user.auth.backupCodes = backupCodes;
      await user.save();

      res.json({
        success: true,
        data: {
          secret: secret.base32,
          qrCode,
          backupCodes,
          manualEntryKey: secret.base32
        },
        message: 'TOTP setup initiated'
      });

    } catch (error) {
      console.error('TOTP setup error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'TOTP setup failed' }
      });
    }
  }

  // Verify and enable TOTP
  async verifyTOTP(req, res) {
    try {
      const schema = Joi.object({
        totpCode: Joi.string().length(6).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { totpCode } = value;
      const { userID } = req.user;

      const user = await User.findOne({ userID, isActive: true });
      if (!user || !user.auth.totpSecret) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'TOTP not set up' }
        });
      }

      const isValid = AuthUtils.verifyTOTP(totpCode, user.auth.totpSecret);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOTP', message: 'Invalid TOTP code' }
        });
      }

      // Enable TOTP
      user.auth.totpEnabled = true;
      await user.save();

      res.json({
        success: true,
        data: { totpEnabled: true },
        message: 'TOTP enabled successfully'
      });

    } catch (error) {
      console.error('TOTP verification error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'TOTP verification failed' }
      });
    }
  }

  // Email OTP fallback
  async sendEmailOTP(req, res) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { email } = value;

      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'User not found' }
        });
      }

      const result = await FirebaseService.sendEmailOTP(email);

      res.json({
        success: true,
        data: { otpSent: true },
        message: 'OTP sent to email'
      });

    } catch (error) {
      console.error('Email OTP error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to send OTP' }
      });
    }
  }

  // Verify email OTP and login
  async verifyEmailOTP(req, res) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { email, otp } = value;

      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'User not found' }
        });
      }

      const result = await FirebaseService.verifyEmailOTP(email, otp);

      // Generate tokens
      const tokens = AuthUtils.generateTokens({
        userID: user.userID,
        orgID: user.orgID,
        role: user.role
      });

      // Update last login
      user.auth.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        data: {
          user: {
            userID: user.userID,
            name: user.name,
            email: user.email,
            role: user.role
          },
          tokens
        },
        message: 'Email OTP verified successfully'
      });

    } catch (error) {
      console.error('Email OTP verification error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'OTP verification failed' }
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const schema = Joi.object({
        refreshToken: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { refreshToken } = value;

      const decoded = AuthUtils.verifyToken(refreshToken, true);
      const user = await User.findOne({ userID: decoded.userID, isActive: true });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }
        });
      }

      const tokens = AuthUtils.generateTokens({
        userID: user.userID,
        orgID: user.orgID,
        role: user.role
      });

      res.json({
        success: true,
        data: { tokens },
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }
      });
    }
  }
}

module.exports = new AuthController();