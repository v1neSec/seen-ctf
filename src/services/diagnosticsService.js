const { execFile } = require("child_process");

const HOST_PATTERN = /^[a-zA-Z0-9.-]{1,253}$/;

function runPing(host, callback) {
  const target = (host || "127.0.0.1").toString().trim();
  if (!HOST_PATTERN.test(target)) {
    return callback(null, `ping: invalid host`);
  }
  const isWin = process.platform === "win32";
  const args = isWin ? ["-n", "1", target] : ["-c", "1", target];
  execFile("ping", args, { timeout: 5000 }, (error, stdout, stderr) => {
    if (error && !stdout) {
      return callback(null, `ping: ${target}: Name or service not known`);
    }
    callback(null, stdout || stderr || "No output");
  });
}

module.exports = { runPing };