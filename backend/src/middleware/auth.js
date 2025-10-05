const AuthUtils = require('../utils/auth');
const { User } = require('../models');

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Access token required' }
      });
    }

    const token = authHeader.substring(7);
    const decoded = AuthUtils.verifyToken(token);
    
    // Get user details
    const user = await User.findOne({ userID: decoded.userID, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'User not found' }
      });
    }

    req.user = {
      userID: user.userID,
      orgID: user.orgID,
      role: user.role,
      permissions: user.permissions
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }
};

// Check user permissions
const checkPermission = (module, action) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions;
    const hasPermission = userPermissions.some(perm => 
      perm.module === module && perm.actions.includes(action)
    );

    if (!hasPermission && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Access denied' }
      });
    }

    next();
  };
};

// Organization isolation middleware
const orgIsolation = (req, res, next) => {
  // Add orgID filter to all queries
  req.orgFilter = { orgID: req.user.orgID };
  next();
};

module.exports = {
  verifyToken,
  checkPermission,
  orgIsolation
};