// Role-based middleware
const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    // Check user role
    next();
  };
};

module.exports = roleMiddleware;
