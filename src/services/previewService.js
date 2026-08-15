async function fetchRemote(url) {
  const target = (url || "").toString();
  if (!target) {
    return { ok: false, status: 400, body: "Missing url parameter" };
  }
  try {
    const response = await fetch(target);
    const text = await response.text();
    return { ok: response.ok, status: response.status, body: text };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      body: `Fetch failed: ${err.message}`,
    };
  }
}

module.exports = { fetchRemote };
