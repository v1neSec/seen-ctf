const fs = require("fs");
const path = require("path");


const DOCS_ROOT = path.join(__dirname, "..", "..", "docs");

function readDocument(requestedPath) {
  const raw = (requestedPath || "readme.txt").toString();


  if (raw.includes("\0") || path.isAbsolute(raw) || raw.split(/[\\/]/).includes("..")) {
    return { success: false, error: "Invalid document path" };
  }


  const resolved = path.resolve(DOCS_ROOT, raw);
  const relative = path.relative(DOCS_ROOT, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { success: false, error: "Invalid document path" };
  }

  try {
    const content = fs.readFileSync(resolved, "utf8");
    return { success: true, content };
  } catch (err) {
    return { success: false, error: "Document not found" };
  }
}

module.exports = { readDocument };