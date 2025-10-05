// Role-based access control middleware
const ROLES = {
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant', 
  ANALYST: 'analyst',
  STAFF: 'staff'
};

const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 4,
  [ROLES.ACCOUNTANT]: 3,
  [ROLES.ANALYST]: 2,
  [ROLES.STAFF]: 1
};

const MODULE_PERMISSIONS = {
  billing: {
    [ROLES.ADMIN]: ['read', 'write', 'delete', 'admin'],
    [ROLES.ACCOUNTANT]: ['read', 'write'],
    [ROLES.ANALYST]: ['read'],
    [ROLES.STAFF]: ['read']
  },
  inventory: {
    [ROLES.ADMIN]: ['read', 'write', 'delete', 'admin'],
    [ROLES.ACCOUNTANT]: ['read', 'write'],
    [ROLES.ANALYST]: ['read'],
    [ROLES.STAFF]: ['read', 'write']
  },
  gst: {
    [ROLES.ADMIN]: ['read', 'write', 'admin'],
    [ROLES.ACCOUNTANT]: ['read', 'write'],
    [ROLES.ANALYST]: ['read'],
    [ROLES.STAFF]: []
  },
  analytics: {
    [ROLES.ADMIN]: ['read', 'write', 'admin'],
    [ROLES.ACCOUNTANT]: ['read'],
    [ROLES.ANALYST]: ['read', 'write'],
    [ROLES.STAFF]: []
  },
  users: {
    [ROLES.ADMIN]: ['read', 'write', 'delete', 'admin'],
    [ROLES.ACCOUNTANT]: ['read'],
    [ROLES.ANALYST]: [],
    [ROLES.STAFF]: []
  }
};

// Check if user has required role
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userLevel = ROLE_HIERARCHY[userRole];
    const requiredLevel = ROLE_HIERARCHY[requiredRole];

    if (userLevel >= requiredLevel) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'INSUFFICIENT_ROLE', 
          message: `${requiredRole} role required` 
        }
      });
    }
  };
};

// Check if user has specific permission for module
const requirePermission = (module, action) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const modulePerms = MODULE_PERMISSIONS[module];
    
    if (!modulePerms || !modulePerms[userRole]) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'MODULE_ACCESS_DENIED', 
          message: `No access to ${module} module` 
        }
      });
    }

    const userPermissions = modulePerms[userRole];
    if (!userPermissions.includes(action)) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'ACTION_NOT_PERMITTED', 
          message: `Cannot ${action} in ${module} module` 
        }
      });
    }

    next();
  };
};

// Admin only access
const adminOnly = requireRole(ROLES.ADMIN);

// Accountant or higher
const accountantOrHigher = requireRole(ROLES.ACCOUNTANT);

// Get user permissions for a module
const getUserPermissions = (userRole, module) => {
  const modulePerms = MODULE_PERMISSIONS[module];
  return modulePerms && modulePerms[userRole] ? modulePerms[userRole] : [];
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  MODULE_PERMISSIONS,
  requireRole,
  requirePermission,
  adminOnly,
  accountantOrHigher,
  getUserPermissions
};