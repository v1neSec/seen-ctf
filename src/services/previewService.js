const dns = require("dns").promises;
const net = require("net");

const ALLOWED_SCHEMES = new Set(["https:"]);
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 5000;

// Optional: if you want a strict allowlist of destination hosts (recommended
// for a "staff URL preview" feature), populate this. Empty set = any public,
// non-private host is allowed (still blocks internal/link-local ranges below).
const ALLOWED_HOSTS = new Set([
  // "cdn.example.com",
  // "images.trusted-partner.com",
]);

function isPrivateOrReservedIPv4(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;

  if (a === 127) return true;                          // loopback
  if (a === 10) return true;                            // private
  if (a === 172 && b >= 16 && b <= 31) return true;      // private
  if (a === 192 && b === 168) return true;               // private
  if (a === 169 && b === 254) return true;               // link-local incl. 169.254.169.254
  if (a === 0) return true;                               // "this network"
  if (a >= 224) return true;                              // multicast/reserved/broadcast
  return false;
}

function isPrivateOrReservedIPv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;                       // loopback
  if (lower.startsWith("fe80:")) return true;              // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("::ffff:")) {
    // IPv4-mapped IPv6 — check the embedded IPv4 address
    const v4 = lower.split("::ffff:")[1];
    if (v4 && net.isIP(v4) === 4) return isPrivateOrReservedIPv4(v4);
  }
  return false;
}

function isBlockedIp(ip) {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateOrReservedIPv4(ip);
  if (version === 6) return isPrivateOrReservedIPv6(ip);
  return true; // unknown format — fail closed
}

async function assertSafeUrl(urlObj) {
  if (!ALLOWED_SCHEMES.has(urlObj.protocol)) {
    throw new Error(`Scheme not allowed: ${urlObj.protocol}`);
  }

  const hostname = urlObj.hostname;

  if (ALLOWED_HOSTS.size > 0 && !ALLOWED_HOSTS.has(hostname)) {
    throw new Error(`Host not on allowlist: ${hostname}`);
  }

  // Block obvious hostname-based tricks up front (metadata DNS aliases etc.)
  const lowerHost = hostname.toLowerCase();
  if (
    lowerHost === "localhost" ||
    lowerHost === "metadata.google.internal" ||
    lowerHost.endsWith(".localhost")
  ) {
    throw new Error("Blocked hostname");
  }

  // Resolve DNS ourselves and check every returned address — this is the
  // step that stops DNS-rebinding-style bypasses of a naive hostname check.
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (err) {
    throw new Error(`DNS resolution failed: ${err.message}`);
  }

  if (addresses.length === 0) {
    throw new Error("No addresses resolved");
  }

  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new Error(`Destination resolves to a blocked address: ${address}`);
    }
  }
}

async function fetchRemote(url) {
  const target = (url || "").toString();
  if (!target) {
    return { ok: false, status: 400, body: "Missing url parameter" };
  }

  let urlObj;
  try {
    urlObj = new URL(target);
  } catch (err) {
    return { ok: false, status: 400, body: "Invalid URL" };
  }

  let currentUrl = urlObj;
  let redirectCount = 0;

  try {
    while (true) {
      await assertSafeUrl(currentUrl);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let response;
      try {
        response = await fetch(currentUrl.toString(), {
          redirect: "manual",
          signal: controller.signal,
          headers: { "User-Agent": "acme-shop-preview/1.0" },
        });
      } finally {
        clearTimeout(timeout);
      }

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          return { ok: false, status: 502, body: "Redirect with no location" };
        }
        redirectCount += 1;
        if (redirectCount > MAX_REDIRECTS) {
          return { ok: false, status: 502, body: "Too many redirects" };
        }
        currentUrl = new URL(location, currentUrl);
        continue;
      }

      const text = await response.text();
      return { ok: response.ok, status: response.status, body: text };
    }
  } catch (err) {
    return { ok: false, status: 502, body: `Fetch failed: ${err.message}` };
  }
}

module.exports = { fetchRemote };