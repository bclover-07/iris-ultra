export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 401 });
    }
    if (!roles.includes(req.user.role)) {
      console.warn(`Permission Denied: User ${req.user.userId} has role '${req.user.role}', but needs one of [${roles.join(', ')}]`);
      return res.status(403).json({ error: 'Insufficient permissions', code: 403 });
    }
    next();
  };
};
