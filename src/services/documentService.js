const fs = require("fs");
const path = require("path");

const DOCS_ROOT = path.join(__dirname, "../../docs");

function readDocument(inputPath) {
  const rawInput = (inputPath || "").toString();
  const resolvedPath = path.join(DOCS_ROOT, rawInput);
  try {
    const content = fs.readFileSync(resolvedPath, "utf8");
    return { success: true, filename: rawInput, content };
  } catch {
    return { success: false, error: `Cannot read file: ${rawInput}` };
  }
}

module.exports = { readDocument };
