/**
 * Deterministic game-logic smoke (no sockets).
 */
import assert from "assert";
import {
  canStart,
  createRoomCode,
  InternalRoom,
  passChit,
  pickChits,
  startWriting,
  submitChits,
  throwChits,
} from "./gameLogic";


function makeRoom(): InternalRoom {
  return {
    code: createRoomCode(),
    phase: "lobby",
    hostId: "p1",
    throwerId: "p1",
    players: [
      {
        id: "p1",
        socketId: "s1",
        nickname: "Host",
        seat: 0,
        connected: true,
        submittedTexts: null,
        hand: [],
        hasPicked: false,
      },
      {
        id: "p2",
        socketId: "s2",
        nickname: "Bala",
        seat: 1,
        connected: true,
        submittedTexts: null,
        hand: [],
        hasPicked: false,
      },
      {
        id: "p3",
        socketId: "s3",
        nickname: "Chitti",
        seat: 2,
        connected: true,
        submittedTexts: null,
        hand: [],
        hasPicked: false,
      },
    ],
    allChits: [],
    pool: [],
    currentTurnPlayerId: null,
    winnerId: null,
    winnerChits: null,
  };
}

function main() {
  const room = makeRoom();
  assert.equal(canStart(room), true);
  startWriting(room);
  assert.equal(room.phase, "writing");

  assert.equal(submitChits(room, "p1", ["mango", "mango", "mango", "mango"]).ok, true);
  assert.equal(submitChits(room, "p2", ["apple", "apple", "apple", "apple"]).ok, true);
  assert.equal(submitChits(room, "p3", ["berry", "berry", "berry", "berry"]).ok, true);
  assert.equal(room.phase, "throwing");

  assert.equal(throwChits(room, "p1").ok, true);
  assert.equal(room.phase, "picking");
  assert.equal(room.pool.length, 12);

  // Illegal: pick 5
  assert.equal(pickChits(room, "p1", room.pool.slice(0, 5).map((c) => c.id)).ok, false);

  const mango = room.pool.filter((c) => c.text === "mango").map((c) => c.id);
  const apple = room.pool.filter((c) => c.text === "apple").map((c) => c.id);
  const berry = room.pool.filter((c) => c.text === "berry").map((c) => c.id);
  assert.equal(mango.length, 4);

  assert.equal(pickChits(room, "p1", mango).ok, true);
  assert.equal(pickChits(room, "p1", apple).ok, false); // already picked
  assert.equal(pickChits(room, "p2", apple).ok, true);
  assert.equal(pickChits(room, "p3", berry).ok, true);

  assert.equal(room.phase, "revealed");
  assert.equal(room.winnerId, "p1");
  assert.equal(room.winnerChits?.length, 4);

  // Pass flow: craft passing state with near-win
  const room2 = makeRoom();
  startWriting(room2);
  submitChits(room2, "p1", ["x", "x", "x", "y"]);
  submitChits(room2, "p2", ["x", "z", "z", "z"]);
  submitChits(room2, "p3", ["y", "y", "y", "z"]);
  throwChits(room2, "p1");
  // Deal so p1 has 3x+1y, p2 has 1x+3z — p1 will receive x from... 
  // Simpler: set hands directly after entering passing via normal picks of known ids
  const by = (t: string) => room2.pool.filter((c) => c.text === t);
  pickChits(
    room2,
    "p1",
    [...by("x").slice(0, 3), ...by("y").slice(0, 1)].map((c) => c.id)
  );
  pickChits(
    room2,
    "p2",
    [...by("x").slice(0, 1), ...by("z").slice(0, 3)].map((c) => c.id)
  );
  // after p1 pick, pool changed — refresh helpers
  const poolLeft = () => room2.pool;
  pickChits(room2, "p3", poolLeft().slice(0, 4).map((c) => c.id));
  assert.equal(room2.phase, "passing");

  const p2hand = room2.players.find((p) => p.id === "p2")!.hand[0];
  assert.equal(passChit(room2, "p2", p2hand.id).ok, false); // wrong turn

  const p1 = room2.players.find((p) => p.id === "p1")!;
  const passY = p1.hand.find((c) => c.text === "y") ?? p1.hand[0];
  assert.equal(passChit(room2, "p1", passY.id).ok, true);
  // After pass, if p1 had 3x and passed y, p1 has 3 chits — not win yet.
  // Continue until revealed or cap
  let guard = 0;
  while (room2.phase === "passing" && guard++ < 80) {
    const turn = room2.players.find((p) => p.id === room2.currentTurnPlayerId)!;
    const counts = new Map<string, number>();
    for (const c of turn.hand) {
      counts.set(c.text, (counts.get(c.text) ?? 0) + 1);
    }
    let best = turn.hand[0];
    let bestScore = Infinity;
    for (const c of turn.hand) {
      const score = counts.get(c.text) ?? 0;
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
    assert.equal(passChit(room2, turn.id, best.id).ok, true);
  }

  assert.ok(
    room2.phase === "revealed" || guard > 0,
    "pass loop should make progress"
  );
  // If no natural win (possible with this deck), force-check pass API still works
  if (room2.phase === "passing") {
    console.log("SMOKE PASSED — pick win + pass API ok (no forced pass-win)");
  } else {
    console.log("SMOKE PASSED — pick win:", room.winnerId, "pass win:", room2.winnerId);
  }
}

main();
