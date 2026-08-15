

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
if (!INTERNAL_TOKEN) {
  throw new Error("INTERNAL_SERVICE_TOKEN is not configured");
}

const LOOPBACK_PATTERNS = [/^127\./, /^::1$/, /^::ffff:127\./];

function isLoopback(ip) {
  return LOOPBACK_PATTERNS.some((re) => re.test(ip || ""));
}

module.exports = function requireInternalAuth(req, res, next) {
  const remoteIp = req.socket && req.socket.remoteAddress;

  if (!isLoopback(remoteIp)) {
    return res.status(404).end(); 
  }

  const token = req.headers["x-internal-token"];
  if (!token || token !== INTERNAL_TOKEN) {
    return res.status(404).end();
  }

  return next();
};