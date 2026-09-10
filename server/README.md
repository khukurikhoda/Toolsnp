# Expo Express Proxy

This small Node.js Express proxy forwards tracking requests to Expo Express while keeping the API key on the server.

Setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Create `.env` from the example and set your API key:

```bash
cp .env.example .env
# edit .env and set APIKEY
```

3. Start the proxy:

```bash
npm start
```

By default the server listens on port `3000`. The website should be served from the same origin (e.g., `http://localhost:8000`) or you can enable CORS appropriately.

API

- `POST /api/track` - accepts JSON `{ awb: "..." }` or `{ awbs: ["...","..."] }` and returns the raw Expo Express response.
