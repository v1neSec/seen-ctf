const { exec } = require("child_process");

function runPing(host, callback) {
  const target = (host || "127.0.0.1").toString();
  const isWin = process.platform === "win32";
  const pingCmd = isWin ? `ping -n 1 ${target}` : `ping -c 1 ${target}`;
  exec(`${pingCmd} 2>&1`, { timeout: 5000 }, (error, stdout, stderr) => {
    if (error && !stdout) {
      return callback(null, `ping: ${target}: Name or service not known`);
    }
    callback(null, stdout || stderr || "No output");
  });
}

module.exports = { runPing };
