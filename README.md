# Tollywood Chit Party

Free real-time multiplayer browser game: write 4 chits, throw the pile, pick 4, pass clockwise until someone has four matching chits. Tollywood GIF reactions for chat.

## Docs

- [Game rules](plans/rules.md)
- [Technology & deploy](plans/technology.md)
- [Implementation checklist](plans/online-chit-game-plan.md)

## Quick start (local)

```bash
npm install
npm run build -w shared
npm run dev
```

- App: http://localhost:5173  
- API/Socket: http://localhost:3001  

Open two browser windows (or phone + desktop), create a room, join with the code, need **3+** players to start.

## Production (one process)

```bash
npm install
npm run build
npm start
```

Then open `http://localhost:3001`.

## Free deploy on Render

1. Push this repo to GitHub.
2. New **Web Service** on https://render.com (free tier).
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm start`
5. Env: `NODE_ENV=production`
6. Open the Render URL and play with friends.

## Smoke test

```bash
npm run build -w shared
npm run smoke -w server
```

## Cost

**$0** — Unity/Apple not required. Render free tier may sleep when idle.
