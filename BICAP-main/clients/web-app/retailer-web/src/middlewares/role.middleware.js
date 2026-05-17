const requireRole = (role) => {
  return (req, res, next) => {
    const roles = req.user?.roles || [];

    if (!roles.includes(role)) {
      return res.status(403).render("login", {
        error: "Bạn không có quyền truy cập",
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
