# Online Chit Game — Implementation Plan (Cursor)

Agent checklist for building and verifying the game. Player rules: [`rules.md`](./rules.md). Stack: [`technology.md`](./technology.md).

## Deliverables

1. Docs: `rules.md`, `technology.md`, this file.
2. Monorepo: `shared/`, `server/`, `client/`.
3. Full phases: lobby → writing → throwing → picking → passing → revealed.
4. Tollywood GIF-only chat.
5. Production serve + README deploy steps; local smoke test.

## File checklist

- `shared/types.ts`, `shared/tollywoodGifs.ts`
- `server/src/gameLogic.ts`, `roomManager.ts`, `index.ts`
- `client` lobby + phase pages + `GifChat` + `ChitCard`
- Root `package.json` scripts: `dev`, `build`, `start`
- `README.md` with local + Render instructions

## Acceptance tests

- [ ] Create room; second browser joins with code.
- [ ] Cannot start with fewer than 3 players.
- [ ] Each player submits 4 chits; thrower throws; pool appears.
- [ ] Cannot confirm pick with ≠ 4; cannot claim taken chits.
- [ ] Wrong-turn pass rejected; correct pass updates hands.
- [ ] Four matching chits (length 4) triggers reveal for all.
- [ ] GIF sent by one client appears for others; unknown gifId rejected.
- [ ] `npm run build && npm start` serves the app on one port.
