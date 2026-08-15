require("dotenv").config();
const crypto = require("crypto");
const { GM_TOKEN } = require("../config/securityConfig");

const SLOTS = ["FLAG1", "FLAG2", "FLAG3", "FLAG4", "FLAG5", "FLAG6"];

const VALUES = Object.fromEntries(
  SLOTS.map((name) => [name, process.env[name] || ""])
);

const GRADER_KEYS = {
  FLAG1: "FLAG1",
  FLAG2: "FLAG2",
  FLAG3: "FLAG3",
  FLAG4: "FLAG4",
  FLAG5: "FLAG5",
  FLAG6: "FLAG6",
};

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

class FlagService {
  getSlot(name) {
    return VALUES[name] || "";
  }

  sha256(value) {
    return crypto.createHash("sha256").update(value || "").digest("hex");
  }

  verifyFlagHash(authHeader, vulnId, submittedHash) {
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
    if (!token || !constantTimeEqual(token, GM_TOKEN)) {
      return { status: 401, data: { error: "Unauthorized request" } };
    }
    if (!vulnId || !submittedHash) {
      return { status: 400, data: { error: "Missing parameters" } };
    }
    const slot = GRADER_KEYS[vulnId] || vulnId;
    const currentFlag = VALUES[slot] || "";
    if (!currentFlag) {
      return { status: 200, data: { match: false } };
    }
    const expected = this.sha256(currentFlag);
    return { status: 200, data: { match: constantTimeEqual(expected, submittedHash) } };
  }
}

module.exports = new FlagService();
