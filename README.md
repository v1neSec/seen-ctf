# Acme Shop

Blue team target application for the SEEN Cyber Rumble CTF.

## Quick start (Codespaces)

1. Create a Codespace from this repository.
2. Set **Codespace secrets** from your organizer env block (`FLAG1`–`FLAG6`, `GM_TOKEN`).
3. Ensure port **3000** is **Public** in the Ports tab.
4. Submit your repo URL and Codespace URL on the CTF platform.

The app starts automatically via the devcontainer. Open the forwarded URL to use the shop.

## Your mission

Deploy this application, paste the flag environment variables, patch security issues during the hardening window, and keep the site working for legitimate customers.

## Rules

- Do **not** remove or disable `POST /__gm/verify`.
- Do **not** delete or blank flag environment variables in production.
- Keep catalog search, checkout, account, and help features working after your changes.

## Local development

```bash
cp .env.example .env
npm install
npm start
```

Visit `http://localhost:3000`.
