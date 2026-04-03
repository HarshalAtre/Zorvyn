const ROLE_HIERARCHY = { viewer: 0, analyst: 1, admin: 2 };

// authorize(...roles) — only allows users whose role is in the list.

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

// authorizeMin(minRole) — allows users at or above the minimum role level.

const authorizeMin = (minRole) => {
  const minLevel = ROLE_HIERARCHY[minRole];
  return (req, res, next) => {
    if (ROLE_HIERARCHY[req.user.role] < minLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Minimum required role: ${minRole}`,
      });
    }
    next();
  };
};

module.exports = { authorize, authorizeMin };
