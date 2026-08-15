const jwt = require("jsonwebtoken");
const flagService = require("./flagService");

const ADMIN_DASHBOARD = {
  status: "operational",
  activeUsers: 1284,
  revenue_today: "$14,322.88",
  last_deploy: "2026-08-10T02:00:00Z",
  internal_ops_token: flagService.getSlot("FLAG5"),
};

const JWT_SECRET = process.env.STAFF_JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("STAFF_JWT_SECRET is not configured");
}

function verifyAdminToken(rawToken) {
  if (!rawToken) {
    return { status: 401, body: { error: "Authorization header required" } };
  }

  let payload;
  try {
    payload = jwt.verify(rawToken, JWT_SECRET, {
      algorithms: ["HS256"],        
      issuer: "toda-internal-auth",
      audience: "staff-admin-api",
    });
  } catch (err) {
    return { status: 401, body: { error: "Invalid or expired token" } };
  }

  if (payload.role !== "admin") {
    return { status: 403, body: { error: "Insufficient privileges" } };
  }

  return { status: 200, body: ADMIN_DASHBOARD };
}

module.exports = { verifyAdminToken };