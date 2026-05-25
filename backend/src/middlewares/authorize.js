export function requireRoles(...roles) {
  return (req, _res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      const err = new Error("Недостатньо прав");
      err.status = 403;
      return next(err);
    }
    next();
  };
}
