const express = require("express");
const flagService = require("../services/flagService");
const catalogService = require("../services/catalogService");
const userService = require("../services/userService");
const documentService = require("../services/documentService");
const previewService = require("../services/previewService");
const diagnosticsService = require("../services/diagnosticsService");
const metadataService = require("../services/metadataService");
const adminService = require("../services/adminService");

const router = express.Router();

router.post("/__gm/verify", (req, res) => {
  const { vulnId, hash } = req.body;
  const result = flagService.verifyFlagHash(req.headers.authorization, vulnId, hash);
  res.status(result.status).json(result.data);
});

router.get("/__internal/metadata", (req, res) => {
  res.json(metadataService.getInstanceMetadata());
});

router.get("/api/users/:id/profile", (req, res) => {
  const requestingUserId = req.headers["x-user-id"];
  const result = userService.getProfileForApi(req.params.id, requestingUserId);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.profile);
});

router.get("/api/products/search", (req, res) => {
  const products = catalogService.searchProducts(req.query.q);
  return res.json(products);
});

router.get("/api/files", (req, res) => {
  const result = documentService.readDocument(req.query.path);
  if (!result.success) {
    return res.status(404).send(result.error);
  }
  return res.type("text/plain").send(result.content);
});

router.get("/api/fetch", async (req, res) => {
  const result = await previewService.fetchRemote(req.query.url);
  return res.status(result.status).type("text/plain").send(result.body);
});

router.get("/api/admin/secret", (req, res) => {
  const rawToken = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const result = adminService.verifyAdminToken(rawToken);
  return res.status(result.status).json(result.body);
});

router.get("/api/ping", (req, res) => {
  diagnosticsService.runPing(req.query.host, (_err, output) => {
    res.type("text/plain").send(output);
  });
});

router.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = userService.authenticate(username, password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  return res.json({
    userId: user.id,
    username: user.username,
    role: user.role,
  });
});

module.exports = router;
