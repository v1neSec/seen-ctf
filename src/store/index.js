const fs = require("fs");
const path = require("path");
const flagService = require("../services/flagService");

const dataDir = path.join(__dirname, "../data");

let products = [];
const users = new Map();
let secretConfig = [];

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
}

function initStore() {
  products = loadJson("products.json");
  secretConfig = loadJson("secret-config.json");

  const apiRow = secretConfig.find((r) => r.key === "internal_api_key");
  if (apiRow) apiRow.value = flagService.getSlot("FLAG3");

  for (const row of loadJson("users.json")) {
    const copy = JSON.parse(JSON.stringify(row));
    if (copy.id === 1) {
      const pending = copy.orderHistory.find((o) => o.orderId === "ORD-0003");
      if (pending) pending.accessToken = flagService.getSlot("FLAG1");
    }
    users.set(String(copy.id), copy);
  }
}

function listProducts() {
  return products;
}

function findProduct(id) {
  return products.find((p) => p.id === Number(id)) || null;
}

function findUserById(id) {
  return users.get(String(id)) || null;
}

function findUserByUsername(username) {
  for (const user of users.values()) {
    if (user.username === username) return user;
  }
  return null;
}

function getSecretConfig() {
  return secretConfig;
}

function appendOrder(userId, order) {
  const user = users.get(String(userId));
  if (!user) return null;
  user.orderHistory.unshift(order);
  return order;
}

module.exports = {
  initStore,
  listProducts,
  findProduct,
  findUserById,
  findUserByUsername,
  getSecretConfig,
  appendOrder,
};
