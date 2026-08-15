function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function productArtClass(category) {
  const key = String(category || "").toLowerCase();
  if (key === "tools") return "product-art-tools";
  if (key === "footwear") return "product-art-footwear";
  if (key === "gadgets") return "product-art-gadgets";
  if (key === "accessories") return "product-art-accessories";
  return "product-art-default";
}

function layout(title, content, opts = {}) {
  const { user, cartCount = 0 } = opts;
  const staffLink =
    user && user.role === "ADMINISTRATOR"
      ? `<a href="/staff">Staff</a>`
      : "";
  const authLinks = user
    ? `<a href="/account">Account</a><a href="/logout">Logout</a>${staffLink}`
    : `<a href="/login">Sign in</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} — Acme Shop</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="/"><span class="brand-mark">A</span>Acme Shop</a>
      <nav class="nav">
        <a href="/">Catalog</a>
        <a href="/cart" class="cart-pill">Cart · ${cartCount}</a>
        <a href="/help">Help</a>
        ${authLinks}
      </nav>
    </div>
  </header>
  <main class="container">
    ${content}
    <div class="footer">© Acme Corporation · Quality gadgets since 1928</div>
  </main>
</body>
</html>`;
}

module.exports = { esc, money, layout, productArtClass };
