# GSMS App | Laboratory Management System

## Open the app (direct links)

| Link | What it does |
| ---- | ------------ |
| **[Open Live App](https://gsms-app.vercel.app)** | Opens the full UI in your browser (login: `admin` / `admin`) |
| **[Open in StackBlitz](https://stackblitz.com/github/LevakuLavanya/gsms-app)** | Runs the app instantly in your browser — no install |
| **[Open in GitHub Codespaces](https://github.com/codespaces/new?repo=LevakuLavanya/gsms-app&ref=main)** | Full dev environment in the cloud (~1–2 min startup) |
| **[GitHub Pages mirror](https://levakulavanya.github.io/gsms-app/)** | Static UI preview (use Live App link above for full API) |

A responsive, mobile-friendly **Laboratory Management System** front end built with
**Angular 20** and **Angular Material**. It consumes the GSMS REST API
(`https://api.gsms.app/api`) for authentication, user management and master/lookup data.

## Features

- **Authentication** – username / password sign-in (`POST /users`).
- **Dashboard** – overview cards (user / role / gender counts).
- **Users** – list with pagination, add, edit and delete users.
- **Masters** – manage lookup data (roles, genders, locations): list, add, delete.
- **Responsive UI** – Angular Material with a collapsible sidenav for mobile devices.
- English-only content throughout.

## Architecture

```
Browser (Angular 20)  ──►  Local proxy (proxy/server.mjs)  ──►  https://api.gsms.app/api
```

The upstream GSMS API requires a JSON **request body on some GET endpoints**
(`GET /users`, `GET /masters`). Browsers cannot send a body with GET requests, so a
small Node proxy (`proxy/server.mjs`, Node built-ins only) sits in front of the API.
It accepts browser-friendly query parameters for those list endpoints and re-issues
the upstream call as a GET-with-body. All other calls are forwarded verbatim.

During development the Angular dev server proxies `/api` to this local proxy
(`proxy.conf.json`).

## Prerequisites

- Node.js `>= 22.5.0` (the proxy and dev server are tested on Node 22).

## Run on GitHub (Codespaces)

You can run the full app directly from GitHub — no local setup required.

1. Open [github.com/gorlamounika2025/gsms-app](https://github.com/gorlamounika2025/gsms-app)
2. Click the green **Code** button
3. Open the **Codespaces** tab
4. Click **Create codespace on main**
5. Wait for the Codespace to build (about 1–2 minutes)
6. Your browser opens the app automatically at port **4200**

Sign in with demo credentials **`admin` / `admin`**.

> The Codespace starts the API proxy (port 4000) and Angular dev server (port 4200)
> automatically. If the browser does not open, click the **Ports** tab and open port 4200.

## Getting started (local)

```bash
npm install        # install dependencies
npm run dev        # starts the API proxy (:4000) AND the Angular dev server (:4200)
```

Then open http://localhost:4200 and sign in with the demo credentials
**`admin` / `admin`**.

### Useful scripts

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Run the proxy + Angular dev server together (recommended) |
| `npm run dev:codespaces` | Same as `dev`, but binds to all interfaces (GitHub Codespaces) |
| `npm run proxy`   | Run only the API proxy (port 4000)                       |
| `npm run serve:web` | Run only `ng serve` with the proxy config              |
| `npm run build`   | Production build into `dist/`                            |
| `npm test`        | Unit tests (Karma/Jasmine, requires Chrome)              |

## Configuration

- `proxy/server.mjs` reads `GSMS_API_BASE` (default `https://api.gsms.app`) and
  `PROXY_PORT` (default `4000`).
- `src/environments/environment.ts` sets `apiBaseUrl` (default `/api`, served via proxy).
