const crypto = require("crypto");

const sessions = new Map();
const secret =
  process.env.SESSION_SECRET ||
  crypto.createHash("sha256").update("acme-shop-session").digest("hex");

function createSession(userId) {
  const id = crypto.randomBytes(24).toString("hex");
  sessions.set(id, {
    userId: userId != null ? String(userId) : null,
    cart: [],
  });
  return id;
}

function destroySession(sessionId) {
  sessions.delete(sessionId);
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

function sessionMiddleware(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.acme_sid;
  req.session = sessionId ? getSession(sessionId) : null;
  req.sessionId = sessionId || null;
  req.user = null;
  if (req.session && req.session.userId) {
    const store = require("../store");
    req.user = store.findUserById(req.session.userId);
  }
  next();
}

function setSessionCookie(res, sessionId) {
  res.setHeader(
    "Set-Cookie",
    `acme_sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "acme_sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );
}

module.exports = {
  createSession,
  destroySession,
  getSession,
  sessionMiddleware,
  setSessionCookie,
  clearSessionCookie,
};
