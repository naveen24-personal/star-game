# Technology

Free stack for the Online Tollywood Chit Game. **$0** to develop and deploy on free tiers.

## Stack

| Layer | Choice |
|-------|--------|
| Client | React + TypeScript + Vite |
| Server | Node.js + Express + Socket.io |
| Shared | TypeScript types + Tollywood GIF catalog |
| State | In-memory room map (no database) |
| Hosting | One Render free Web Service (API + static client) |

## Repository layout

```text
/
  plans/rules.md
  plans/technology.md
  plans/online-chit-game-plan.md
  package.json
  shared/
    types.ts
    tollywoodGifs.ts
  server/
    package.json
    tsconfig.json
    src/index.ts
    src/roomManager.ts
    src/gameLogic.ts
  client/
    package.json
    vite.config.ts
    index.html
    src/...
  README.md
```

## Environment

| Variable | Where | Default |
|----------|--------|---------|
| `PORT` | server | `3001` |
| `NODE_ENV` | server | `development` / `production` |
| `CLIENT_ORIGIN` | server (dev) | `http://localhost:5173` |

In production the server serves `client/dist` from the same origin, so CORS is not required for the SPA.

## Local development

```bash
# from repo root
npm install
npm run dev
```

- Client: http://localhost:5173 (proxies Socket.io to the server)
- Server: http://localhost:3001

Or run separately:

```bash
npm run dev:server
npm run dev:client
```

## Production build

```bash
npm run build
npm start
```

`npm start` runs the compiled server, which serves the built client and Socket.io.

## Free deploy (Render)

1. Push this repo to GitHub (public or private).
2. Create a **Web Service** on [Render](https://render.com) (free tier), or use the included [`render.yaml`](../render.yaml) Blueprint.
3. Settings:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Environment:** `NODE_ENV=production`
4. Open the Render URL on two devices, create/join a room, play a full round.

Cold starts on the free tier may take ~30–60s after idle.

## Socket events (summary)

**Client → server**

- `room:create` `{ nickname }`
- `room:join` `{ code, nickname }`
- `room:start`
- `chits:submit` `{ texts: string[4] }`
- `chits:throw`
- `chits:pick` `{ chitIds: string[4] }`
- `chits:pass` `{ chitId }`
- `chat:gif` `{ gifId }`
- `room:playAgain`

**Server → client**

- `room:update` full public room snapshot
- `room:error` `{ message }`
- `chat:message` `{ playerId, nickname, gifId, at }`

## Security notes (MVP)

- No auth; room codes are short-lived secrets.
- Server validates every game action.
- GIF chat accepts only IDs from `shared/tollywoodGifs.ts`.
