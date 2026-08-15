const store = require("../store");

function getCart(session) {
  if (!session) return [];
  return session.cart;
}

function addItem(session, productId, qty) {
  if (!session) return { error: "No session" };
  const product = store.findProduct(productId);
  if (!product) return { error: "Product not found" };
  const quantity = Math.max(1, Number(qty) || 1);
  const existing = session.cart.find((l) => l.productId === product.id);
  if (existing) {
    existing.qty += quantity;
  } else {
    session.cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: quantity,
    });
  }
  return { ok: true, cart: session.cart };
}

function updateQty(session, productId, qty) {
  if (!session) return { error: "No session" };
  const line = session.cart.find((l) => l.productId === Number(productId));
  if (!line) return { error: "Item not in cart" };
  const quantity = Number(qty);
  if (quantity <= 0) {
    session.cart = session.cart.filter((l) => l.productId !== Number(productId));
  } else {
    line.qty = quantity;
  }
  return { ok: true, cart: session.cart };
}

function clearCart(session) {
  if (session) session.cart = [];
}

function cartTotal(cart) {
  return cart.reduce((sum, line) => sum + line.price * line.qty, 0);
}

function cartCount(cart) {
  return cart.reduce((sum, line) => sum + line.qty, 0);
}

module.exports = {
  getCart,
  addItem,
  updateQty,
  clearCart,
  cartTotal,
  cartCount,
};
