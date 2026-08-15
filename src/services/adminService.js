const flagService = require("./flagService");
const CryptoUtil = require("../lib/cryptoUtil");

const ADMIN_DASHBOARD = {
  status: "operational",
  activeUsers: 1284,
  revenue_today: "$14,322.88",
  last_deploy: "2026-08-10T02:00:00Z",
  internal_ops_token: flagService.getSlot("FLAG5"),
};

function verifyAdminToken(rawToken) {
  if (!rawToken) {
    return { status: 401, body: { error: "Authorization header required" } };
  }
  const header = CryptoUtil.parseJwtHeader(rawToken);
  if (!header) {
    return { status: 401, body: { error: "Malformed token" } };
  }
  if (header.alg === "none" || header.alg === "NONE") {
    return { status: 200, body: ADMIN_DASHBOARD };
  }
  return { status: 403, body: { error: "Invalid token signature" } };
}

module.exports = { verifyAdminToken };
