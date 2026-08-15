const crypto = require("crypto");

class CryptoUtil {
  static sha256(value) {
    return crypto.createHash("sha256").update(value || "").digest("hex");
  }

  static parseJwtHeader(token) {
    if (!token) return null;
    const parts = token.replace(/^Bearer\s+/i, "").split(".");
    if (parts.length < 2) return null;
    try {
      const headerStr = Buffer.from(parts[0], "base64url").toString("utf8");
      return JSON.parse(headerStr);
    } catch {
      return null;
    }
  }
}

module.exports = CryptoUtil;
