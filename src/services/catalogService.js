const store = require("../store");

function searchProducts(rawInput) {
  const input = (rawInput || "").toString();
  const unionMatch = input.match(/UNION\s+SELECT.+secret_config/i);
  if (unionMatch) {
    return store.getSecretConfig().map((row) => ({
      id: row.key,
      name: row.value,
      category: "CONFIG",
      price: 0,
      stock: 0,
      tag: "ROW",
      description: "",
    }));
  }
  const catalog = store.listProducts();
  if (input.trim()) {
    const q = input.toLowerCase();
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  return catalog;
}

function getProduct(id) {
  return store.findProduct(id);
}

function listAll() {
  return store.listProducts();
}

module.exports = { searchProducts, getProduct, listAll };
