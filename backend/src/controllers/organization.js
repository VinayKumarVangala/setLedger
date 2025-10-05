const { Organization, User } = require('../models');
const { ROLES, MODULE_PERMISSIONS } = require('../middleware/roles');
const AuthUtils = require('../utils/auth');
const EmailService = require('../services/email');
const Joi = require('joi');

class OrganizationController {
  // Get organization details
  async getOrganization(req, res) {
    try {
      const { orgID } = req.user;
      
      const organization = await Organization.findOne({ orgID, isActive: true });
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Organization not found' }
        });
      }

      const memberCount = await User.countDocuments({ orgID, isActive: true });

      res.json({
        success: true,
        data: {
          organization: {
            orgID: organization.orgID,
            name: organization.name,
            email: organization.email,
            phone: organization.phone,
            address: organization.address,
            gstin: organization.gstin,
            businessType: organization.businessType,
            subscription: organization.subscription,
            settings: organization.settings,
            memberCount,
            createdAt: organization.createdAt
          }
        }
      });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get organization' }
      });
    }
  }

  // Update organization details (Admin only)
  async updateOrganization(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().trim().min(2).max(100),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        address: Joi.object({
          street: Joi.string().allow(''),
          city: Joi.string().allow(''),
          state: Joi.string().allow(''),
          country: Joi.string().allow(''),
          pincode: Joi.string().allow('')
        }),
        gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
        businessType: Joi.string().valid('retail', 'wholesale', 'service', 'manufacturing'),
        settings: Joi.object({
          currency: Joi.string().valid('INR', 'USD', 'EUR'),
          timezone: Joi.string(),
          dateFormat: Joi.string().valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')
        })
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { orgID, userID } = req.user;
      const updateData = { ...value, updatedBy: userID };

      const organization = await Organization.findOneAndUpdate(
        { orgID, isActive: true },
        updateData,
        { new: true }
      );

      res.json({
        success: true,
        data: { organization },
        message: 'Organization updated successfully'
      });
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update organization' }
      });
    }
  }

  // Invite team member via email (Admin only)
  async inviteMember(req, res) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().required().trim().min(2).max(50),
        role: Joi.string().valid(...Object.values(ROLES)).required(),
        message: Joi.string().max(500).allow('')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { email, name, role, message } = value;
      const { orgID, userID: invitedBy } = req.user;

      // Check if email already exists in organization
      const existingUser = await User.findOne({ orgID, email, isActive: true });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_RESOURCE', message: 'User already exists in organization' }
        });
      }

      // Get organization details
      const organization = await Organization.findOne({ orgID });
      const inviter = await User.findOne({ userID: invitedBy });

      // Generate invitation token
      const invitationToken = AuthUtils.generateInvitationToken({
        orgID,
        email,
        name,
        role,
        invitedBy,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Store invitation in database
      const memberCount = await User.countDocuments({ orgID });
      const memberID = AuthUtils.generateMemberID(memberCount);
      const newUserID = AuthUtils.generateUserID(orgID, memberID);

      // Create inactive user record for invitation tracking
      const rolePermissions = Object.keys(MODULE_PERMISSIONS).map(module => ({
        module,
        actions: MODULE_PERMISSIONS[module][role] || []
      })).filter(perm => perm.actions.length > 0);

      const invitedUser = new User({
        userID: newUserID,
        orgID,
        memberID,
        name,
        email,
        role,
        permissions: rolePermissions,
        isActive: false, // Will be activated when invitation is accepted
        invitation: {
          token: invitationToken,
          invitedBy,
          invitedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        createdBy: invitedBy,
        updatedBy: invitedBy
      });

      await invitedUser.save();

      // Send invitation email
      const invitationLink = `${process.env.FRONTEND_URL}/invite/${invitationToken}`;
      
      try {
        await EmailService.sendInvitation({
          to: email,
          organizationName: organization.name,
          inviterName: inviter.name,
          inviteeName: name,
          role,
          invitationLink,
          message,
          expiresIn: '7 days'
        });
      } catch (emailError) {
        console.warn('Failed to send invitation email:', emailError.message);
      }

      res.status(201).json({
        success: true,
        data: {
          invitation: {
            userID: newUserID,
            email,
            name,
            role,
            invitationToken,
            expiresAt: invitedUser.invitation.expiresAt
          }
        },
        message: 'Invitation sent successfully'
      });
    } catch (error) {
      console.error('Invite member error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to send invitation' }
      });
    }
  }

  // Accept invitation and complete registration
  async acceptInvitation(req, res) {
    try {
      const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().required().min(8)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { token, password } = value;

      // Verify invitation token
      let tokenData;
      try {
        tokenData = AuthUtils.verifyInvitationToken(token);
      } catch (tokenError) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired invitation' }
        });
      }

      // Find invited user
      const user = await User.findOne({
        orgID: tokenData.orgID,
        email: tokenData.email,
        'invitation.token': token,
        'invitation.status': 'pending'
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Invitation not found' }
        });
      }

      // Check if invitation expired
      if (new Date() > user.invitation.expiresAt) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVITATION_EXPIRED', message: 'Invitation has expired' }
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

      // Hash password and activate user
      const hashedPassword = await AuthUtils.hashPassword(password);
      
      user.password = hashedPassword;
      user.isActive = true;
      user.invitation.status = 'accepted';
      user.invitation.acceptedAt = new Date();
      user.updatedBy = user.userID;

      await user.save();

      // Generate tokens for immediate login
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
        message: 'Invitation accepted successfully'
      });
    } catch (error) {
      console.error('Accept invitation error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to accept invitation' }
      });
    }
  }

  // Get pending invitations (Admin only)
  async getPendingInvitations(req, res) {
    try {
      const { orgID } = req.user;
      
      const pendingInvitations = await User.find({
        orgID,
        isActive: false,
        'invitation.status': 'pending',
        'invitation.expiresAt': { $gt: new Date() }
      }).select('userID name email role invitation.invitedAt invitation.expiresAt invitation.invitedBy');

      res.json({
        success: true,
        data: { invitations: pendingInvitations }
      });
    } catch (error) {
      console.error('Get pending invitations error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get invitations' }
      });
    }
  }

  // Cancel invitation (Admin only)
  async cancelInvitation(req, res) {
    try {
      const { invitationId } = req.params;
      const { orgID } = req.user;

      const invitation = await User.findOneAndUpdate(
        {
          userID: invitationId,
          orgID,
          isActive: false,
          'invitation.status': 'pending'
        },
        {
          'invitation.status': 'cancelled',
          'invitation.cancelledAt': new Date()
        },
        { new: true }
      );

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Invitation not found' }
        });
      }

      res.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel invitation error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel invitation' }
      });
    }
  }
}

module.exports = new OrganizationController();