require("dotenv").config();

module.exports = {
  GM_TOKEN: process.env.GM_TOKEN || "",
  HASH_ALGORITHM: "sha256",
};
