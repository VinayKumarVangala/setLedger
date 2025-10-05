const { User, Organization } = require('../models');
const { ROLES, MODULE_PERMISSIONS, getUserPermissions } = require('../middleware/roles');
const AuthUtils = require('../utils/auth');
const Joi = require('joi');

class UserController {
  // Get current user profile
  async getProfile(req, res) {
    try {
      const { userID } = req.user;
      
      const user = await User.findOne({ userID, isActive: true })
        .select('-password -auth.totpSecret -auth.backupCodes');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'User not found' }
        });
      }

      const organization = await Organization.findOne({ orgID: user.orgID });

      res.json({
        success: true,
        data: {
          user: {
            userID: user.userID,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            permissions: user.permissions,
            profile: user.profile,
            lastLogin: user.auth.lastLogin
          },
          organization: {
            orgID: organization.orgID,
            name: organization.name,
            businessType: organization.businessType
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get profile' }
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().trim().min(2).max(50),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        preferences: Joi.object({
          theme: Joi.string().valid('light', 'dark'),
          language: Joi.string().valid('en', 'hi', 'ta', 'te', 'kn'),
          notifications: Joi.boolean()
        })
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { userID } = req.user;
      const updateData = { ...value, updatedBy: userID };

      if (value.preferences) {
        updateData['profile.preferences'] = value.preferences;
        delete updateData.preferences;
      }

      const user = await User.findOneAndUpdate(
        { userID, isActive: true },
        updateData,
        { new: true }
      ).select('-password -auth.totpSecret -auth.backupCodes');

      res.json({
        success: true,
        data: { user },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' }
      });
    }
  }

  // Get team members (Admin/Accountant only)
  async getTeamMembers(req, res) {
    try {
      const { orgID } = req.user;
      const { page = 1, limit = 20, role, search } = req.query;

      const filter = { orgID, isActive: true };
      if (role && Object.values(ROLES).includes(role)) {
        filter.role = role;
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .select('-password -auth.totpSecret -auth.backupCodes')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get team members error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get team members' }
      });
    }
  }

  // Create new team member (Admin only)
  async createTeamMember(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().required().trim().min(2).max(50),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        role: Joi.string().valid(...Object.values(ROLES)).required(),
        password: Joi.string().required().min(8)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { name, email, phone, role, password } = value;
      const { orgID, userID: createdBy } = req.user;

      // Check if email already exists in organization
      const existingUser = await User.findOne({ orgID, email, isActive: true });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_RESOURCE', message: 'Email already exists' }
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

      // Generate member ID
      const memberCount = await User.countDocuments({ orgID });
      const memberID = AuthUtils.generateMemberID(memberCount);
      const newUserID = AuthUtils.generateUserID(orgID, memberID);

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Get role permissions
      const rolePermissions = Object.keys(MODULE_PERMISSIONS).map(module => ({
        module,
        actions: MODULE_PERMISSIONS[module][role] || []
      })).filter(perm => perm.actions.length > 0);

      // Create user
      const user = new User({
        userID: newUserID,
        orgID,
        memberID,
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        permissions: rolePermissions,
        createdBy,
        updatedBy: createdBy
      });

      await user.save();

      res.status(201).json({
        success: true,
        data: {
          user: {
            userID: user.userID,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions
          }
        },
        message: 'Team member created successfully'
      });
    } catch (error) {
      console.error('Create team member error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create team member' }
      });
    }
  }

  // Update team member role/permissions (Admin only)
  async updateTeamMember(req, res) {
    try {
      const schema = Joi.object({
        role: Joi.string().valid(...Object.values(ROLES)),
        isActive: Joi.boolean()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { targetUserID } = req.params;
      const { orgID, userID: updatedBy } = req.user;

      const targetUser = await User.findOne({ 
        userID: targetUserID, 
        orgID, 
        isActive: true 
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'User not found' }
        });
      }

      // Prevent admin from demoting themselves
      if (targetUserID === updatedBy && value.role && value.role !== ROLES.ADMIN) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: 'Cannot change your own role' }
        });
      }

      const updateData = { updatedBy };

      if (value.role) {
        updateData.role = value.role;
        // Update permissions based on new role
        updateData.permissions = Object.keys(MODULE_PERMISSIONS).map(module => ({
          module,
          actions: MODULE_PERMISSIONS[module][value.role] || []
        })).filter(perm => perm.actions.length > 0);
      }

      if (value.isActive !== undefined) {
        updateData.isActive = value.isActive;
      }

      const updatedUser = await User.findOneAndUpdate(
        { userID: targetUserID, orgID },
        updateData,
        { new: true }
      ).select('-password -auth.totpSecret -auth.backupCodes');

      res.json({
        success: true,
        data: { user: updatedUser },
        message: 'Team member updated successfully'
      });
    } catch (error) {
      console.error('Update team member error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update team member' }
      });
    }
  }

  // Get user permissions for modules
  async getUserPermissions(req, res) {
    try {
      const { role } = req.user;
      
      const permissions = Object.keys(MODULE_PERMISSIONS).reduce((acc, module) => {
        acc[module] = getUserPermissions(role, module);
        return acc;
      }, {});

      res.json({
        success: true,
        data: { permissions }
      });
    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get permissions' }
      });
    }
  }
}

module.exports = new UserController();