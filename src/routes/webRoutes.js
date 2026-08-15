const express = require("express");
const catalogService = require("../services/catalogService");
const userService = require("../services/userService");
const cartService = require("../services/cartService");
const orderService = require("../services/orderService");
const documentService = require("../services/documentService");
const previewService = require("../services/previewService");
const diagnosticsService = require("../services/diagnosticsService");
const adminService = require("../services/adminService");
const sessionLib = require("../middleware/session");
const { esc, money, layout, productArtClass } = require("../views/render");

const router = express.Router();

function page(res, title, html, req) {
  const cart = req.session ? cartService.getCart(req.session) : [];
  res.send(
    layout(title, html, {
      user: req.user,
      cartCount: cartService.cartCount(cart),
    })
  );
}

function requireLogin(req, res, next) {
  if (!req.user) {
    return res.redirect("/login?next=" + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireStaff(req, res, next) {
  if (!req.user || req.user.role !== "ADMINISTRATOR") {
    return res.status(403).send(
      layout("Forbidden", `<div class="alert alert-error">Staff access only.</div>`, {
        user: req.user,
        cartCount: 0,
      })
    );
  }
  next();
}

router.get("/", (req, res) => {
  const q = (req.query.q || "").toString();
  const products = catalogService.searchProducts(q);
  const cards = products
    .map(
      (p) => `
    <article class="card product-card">
      <div class="product-art ${productArtClass(p.category)}">
        <span class="badge">${esc(p.tag)}</span>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span class="text-muted" style="color:var(--muted);font-size:0.8rem;">${esc(p.category)}</span>
          <span class="price">${money(p.price)}</span>
        </div>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <a class="btn btn-secondary btn-block" href="/products/${p.id}">View product</a>
      </div>
    </article>`
    )
    .join("");
  page(
    res,
    "Catalog",
    `
    <div class="hero">
      <div class="hero-badge">Official storefront</div>
      <h1>Impossible gear,<br/>delivered worldwide.</h1>
      <p>Anvils, rocket boots, portable holes — everything your cartoon enterprise needs.</p>
    </div>
    <div class="card">
      <form method="GET" action="/" class="split">
        <div class="form-row" style="flex:1;margin:0;">
          <label for="q">Search catalog</label>
          <input class="input" id="q" name="q" value="${esc(q)}" placeholder="Try &quot;rocket&quot; or &quot;anvil&quot;" />
        </div>
        <button class="btn" type="submit">Search</button>
      </form>
    </div>
    <div class="grid">${cards || `<p class="alert alert-info">No products match your search.</p>`}</div>`,
    req
  );
});

router.get("/products/:id", (req, res) => {
  const product = catalogService.getProduct(req.params.id);
  if (!product) {
    return page(res, "Not found", `<div class="alert alert-error">Product not found.</div>`, req);
  }
  page(
    res,
    product.name,
    `
    <div class="card product-card" style="max-width:720px;margin:0 auto;">
      <div class="product-art ${productArtClass(product.category)}" style="height:200px;">
        <span class="badge">${esc(product.tag)}</span>
      </div>
      <div class="product-body">
        <p style="color:var(--muted);font-size:0.85rem;margin-bottom:0.35rem;">${esc(product.category)}</p>
        <h1 style="margin-bottom:0.5rem;letter-spacing:-0.03em;">${esc(product.name)}</h1>
        <p style="color:var(--muted);margin-bottom:1rem;">${esc(product.description)}</p>
        <p class="price" style="margin-bottom:1.25rem;">${money(product.price)} · ${product.stock} in stock</p>
        <form method="POST" action="/cart/add" class="split">
          <input type="hidden" name="productId" value="${product.id}" />
          <div class="form-row" style="margin:0;width:5rem;">
            <label for="qty">Qty</label>
            <input class="input" id="qty" name="qty" type="number" min="1" value="1" />
          </div>
          <button class="btn" type="submit">Add to cart</button>
        </form>
      </div>
    </div>`,
    req
  );
});

router.get("/login", (req, res) => {
  if (req.user) return res.redirect("/account");
  const err = req.query.error ? `<div class="alert alert-error">${esc(req.query.error)}</div>` : "";
  page(
    res,
    "Sign in",
    `
    ${err}
    <div class="auth-shell">
    <div class="card">
      <h2 style="margin-bottom:0.5rem;">Sign in</h2>
      <p style="color:var(--muted);margin-bottom:1rem;font-size:0.9rem;">Access your orders and checkout faster.</p>
      <form method="POST" action="/login">
        <input type="hidden" name="next" value="${esc(req.query.next || "/")}" />
        <div class="form-row">
          <label for="username">Username</label>
          <input class="input" id="username" name="username" required autocomplete="username" />
        </div>
        <div class="form-row">
          <label for="password">Password</label>
          <input class="input" id="password" name="password" type="password" required autocomplete="current-password" />
        </div>
        <button class="btn btn-block" type="submit">Sign in</button>
      </form>
    </div>
    </div>`,
    req
  );
});

router.post("/login", (req, res) => {
  const user = userService.authenticate(req.body.username, req.body.password);
  if (!user) {
    return res.redirect("/login?error=Invalid+credentials");
  }
  const oldCart = req.session?.cart || [];
  if (req.sessionId) sessionLib.destroySession(req.sessionId);
  const sid = sessionLib.createSession(user.id);
  const sess = sessionLib.getSession(sid);
  sess.cart = oldCart;
  sessionLib.setSessionCookie(res, sid);
  const next = (req.body.next || "/").toString();
  res.redirect(next.startsWith("/") ? next : "/");
});

router.get("/logout", (req, res) => {
  if (req.sessionId) sessionLib.destroySession(req.sessionId);
  sessionLib.clearSessionCookie(res);
  res.redirect("/");
});

router.post("/cart/add", (req, res) => {
  if (!req.session) {
    const sid = sessionLib.createSession(null);
    sessionLib.setSessionCookie(res, sid);
    req.session = sessionLib.getSession(sid);
  }
  cartService.addItem(req.session, req.body.productId, req.body.qty);
  res.redirect("/cart");
});

router.get("/cart", (req, res) => {
  const cart = req.session ? cartService.getCart(req.session) : [];
  const rows =
    cart.length === 0
      ? `<p style="color:var(--muted);">Your cart is empty.</p>`
      : `<table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th></th></tr></thead>
        <tbody>${cart
          .map(
            (line) => `
          <tr>
            <td>${esc(line.name)}</td>
            <td>
              <form method="POST" action="/cart/update" style="display:inline;">
                <input type="hidden" name="productId" value="${line.productId}" />
                <input class="input" style="width:4rem;display:inline;" name="qty" type="number" min="0" value="${line.qty}" />
                <button class="btn btn-secondary" type="submit" style="padding:0.35rem 0.6rem;">Update</button>
              </form>
            </td>
            <td>${money(line.price * line.qty)}</td>
          </tr>`
          )
          .join("")}</tbody></table>`;
  const checkout =
    cart.length > 0 && req.user
      ? `<form method="POST" action="/checkout"><button class="btn" type="submit">Checkout</button></form>`
      : cart.length > 0
      ? `<p class="alert alert-info"><a href="/login?next=/cart">Sign in</a> to checkout.</p>`
      : "";
  page(
    res,
    "Cart",
    `<div class="card"><h2 style="margin-bottom:1rem;">Shopping cart</h2>${rows}<div style="margin-top:1rem;">${checkout}</div></div>`,
    req
  );
});

router.post("/cart/update", (req, res) => {
  if (req.session) cartService.updateQty(req.session, req.body.productId, req.body.qty);
  res.redirect("/cart");
});

router.post("/checkout", requireLogin, (req, res) => {
  const result = orderService.checkout(req.session, req.user);
  if (!result.ok) {
    return page(res, "Checkout", `<div class="alert alert-error">${esc(result.error)}</div>`, req);
  }
  page(
    res,
    "Order placed",
    `<div class="alert alert-success">Order ${esc(result.order.orderId)} placed — total ${money(result.order.total)}.</div>
     <a class="btn" href="/account">View account</a>`,
    req
  );
});

router.get("/account", requireLogin, (req, res) => {
  const profile = userService.getFullProfile(req.user.id);
  const orders = (profile.orderHistory || [])
    .map(
      (o) => `
    <tr>
      <td>${esc(o.orderId)}</td>
      <td>${esc(o.item)}</td>
      <td>${money(o.total)}</td>
      <td>${esc(o.status)}</td>
    </tr>`
    )
    .join("");
  page(
    res,
    "Account",
    `
    <div class="card">
      <h2 style="margin-bottom:0.25rem;">${esc(profile.fullName)}</h2>
      <p style="color:var(--muted);margin-bottom:1rem;">@${esc(profile.username)} · ${esc(profile.email)}</p>
      <h3 style="margin-bottom:0.75rem;">Order history</h3>
      <table>
        <thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${orders}</tbody>
      </table>
    </div>`,
    req
  );
});

router.get("/help", (req, res) => {
  const doc = (req.query.doc || "readme.txt").toString();
  const result = documentService.readDocument(doc);
  const body = result.success
    ? `<pre>${esc(result.content)}</pre>`
    : `<div class="alert alert-error">${esc(result.error)}</div>`;
  page(
    res,
    "Help",
    `
    <div class="card">
      <h2 style="margin-bottom:0.75rem;">Help center</h2>
      <form method="GET" action="/help" class="split">
        <div class="form-row" style="flex:1;margin:0;">
          <label for="doc">Document</label>
          <input class="input" id="doc" name="doc" value="${esc(doc)}" />
        </div>
        <button class="btn" type="submit">Open</button>
      </form>
    </div>
    <div class="card">${body}</div>`,
    req
  );
});

router.get("/staff", requireStaff, (req, res) => {
  page(
    res,
    "Staff",
    `
    <div class="hero"><h1>Staff tools</h1><p>Internal utilities for merchandising and support.</p></div>
    <div class="grid staff-grid">
      <a class="card" href="/staff/preview" style="text-decoration:none;color:inherit;">
        <h3>URL preview</h3>
        <p style="color:var(--muted);font-size:0.9rem;">Validate supplier and asset URLs before publishing.</p>
      </a>
      <a class="card" href="/staff/diagnostics" style="text-decoration:none;color:inherit;">
        <h3>Network diagnostics</h3>
        <p style="color:var(--muted);font-size:0.9rem;">Ping hosts reported in support tickets.</p>
      </a>
      <a class="card" href="/staff/admin" style="text-decoration:none;color:inherit;">
        <h3>Operations API</h3>
        <p style="color:var(--muted);font-size:0.9rem;">Verify service tokens against the admin API.</p>
      </a>
    </div>`,
    req
  );
});

router.get("/staff/preview", requireStaff, async (req, res) => {
  const url = (req.query.url || "").toString();
  let preview = "";
  if (url) {
    const result = await previewService.fetchRemote(url);
    preview = `<div class="card"><h3>Response</h3><pre>${esc(result.body.slice(0, 8000))}</pre></div>`;
  }
  page(
    res,
    "URL preview",
    `
    <div class="card">
      <h2>URL preview</h2>
      <form method="GET" action="/staff/preview" class="split">
        <div class="form-row" style="flex:1;margin:0;">
          <label for="url">Remote URL</label>
          <input class="input" id="url" name="url" value="${esc(url)}" placeholder="https://..." />
        </div>
        <button class="btn" type="submit">Fetch</button>
      </form>
    </div>${preview}`,
    req
  );
});

router.get("/staff/diagnostics", requireStaff, (req, res) => {
  const host = (req.query.host || "").toString();
  let output = "";
  if (host) {
    output = `<div class="card"><h3>Output</h3><iframe src="/api/ping?host=${encodeURIComponent(host)}" style="width:100%;height:180px;border:1px solid var(--border);border-radius:8px;background:#0c1018;"></iframe></div>`;
  }
  page(
    res,
    "Diagnostics",
    `
    <div class="card">
      <h2>Network diagnostics</h2>
      <form method="GET" action="/staff/diagnostics" class="split">
        <div class="form-row" style="flex:1;margin:0;">
          <label for="host">Host</label>
          <input class="input" id="host" name="host" value="${esc(host)}" placeholder="127.0.0.1" />
        </div>
        <button class="btn" type="submit">Run ping</button>
      </form>
    </div>${output}`,
    req
  );
});

router.get("/staff/admin", requireStaff, (req, res) => {
  page(
    res,
    "Operations API",
    `
    <div class="card">
      <h2>Operations API</h2>
      <p style="color:var(--muted);margin-bottom:1rem;font-size:0.9rem;">Paste a bearer token to query <code>/api/admin/secret</code>.</p>
      <div class="form-row">
        <label for="token">Bearer token</label>
        <input class="input" id="token" placeholder="JWT..." />
      </div>
      <button class="btn" type="button" id="run">Query API</button>
    </div>
    <div class="card" id="out" style="display:none;"><pre id="outtext"></pre></div>
    <script>
      document.getElementById("run").onclick = async function () {
        const token = document.getElementById("token").value;
        const res = await fetch("/api/admin/secret", { headers: { Authorization: "Bearer " + token } });
        document.getElementById("out").style.display = "block";
        document.getElementById("outtext").textContent = await res.text();
      };
    </script>`,
    req
  );
});

module.exports = router;
