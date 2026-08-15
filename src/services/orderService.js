const store = require("../store");
const cartService = require("./cartService");

function checkout(session, user) {
  if (!session || !user) {
    return { error: "Login required", status: 401 };
  }
  const cart = cartService.getCart(session);
  if (cart.length === 0) {
    return { error: "Cart is empty", status: 400 };
  }
  const total = cartService.cartTotal(cart);
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const itemSummary = cart.map((l) => `${l.name} x${l.qty}`).join(", ");
  const order = {
    orderId,
    item: itemSummary,
    total: Math.round(total * 100) / 100,
    status: "Processing",
  };
  store.appendOrder(user.id, order);
  cartService.clearCart(session);
  return { ok: true, order, status: 200 };
}

module.exports = { checkout };
