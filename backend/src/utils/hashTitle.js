const crypto = require("crypto");

function hashTitle(title) {
  return crypto
    .createHash("sha256")
    .update(title.trim().toLowerCase())
    .digest("hex");
}

module.exports = hashTitle;