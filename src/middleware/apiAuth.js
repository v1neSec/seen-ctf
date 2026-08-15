
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireStaff(req, res, next) {
  if (!req.user || req.user.role !== "ADMINISTRATOR") {
    return res.status(403).json({ error: "Staff access only" });
  }
  next();
}

module.exports = { requireAuth, requireStaff };