function requireApiLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireApiStaff(req, res, next) {
  if (!req.user || req.user.role !== "ADMINISTRATOR") {
    return res.status(403).json({ error: "Staff access only" });
  }
  next();
}

module.exports = { requireApiLogin, requireApiStaff };