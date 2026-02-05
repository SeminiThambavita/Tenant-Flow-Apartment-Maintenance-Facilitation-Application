// Role-based middleware
const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    // Check user role
    next();
  };
};

export default roleMiddleware;
