// Gate for staff-only API routes. Mirrors requireStaff from webRoutes.js so
// /api/fetch enforces the same session-based auth as /staff/preview, rather
// than inventing a separate auth scheme for the API layer.

module.exports = function requireStaffAuth(req, res, next) {
  if (!req.user || req.user.role !== "ADMINISTRATOR") {
    return res.status(403).json({ error: "Staff access only" });
  }
  next();
};