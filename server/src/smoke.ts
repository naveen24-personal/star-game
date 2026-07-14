/**
 * Deterministic game-logic smoke (no sockets).
 */
import assert from "assert";
import {
  canStart,
  claimChit,
  createRoomCode,
  InternalRoom,
  passChit,
  pickChits,
  releaseChit,
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
    lastPass: null,
  };
}

function main() {
  const room = makeRoom();
  assert.equal(canStart(room), true);
  startWriting(room);
  assert.equal(room.phase, "writing");

  assert.equal(submitChits(room, "p1", "mango").ok, true);
  assert.equal(submitChits(room, "p2", "apple").ok, true);
  assert.equal(submitChits(room, "p3", "berry").ok, true);
  assert.equal(room.phase, "throwing");
  assert.equal(room.allChits.length, 12);
  assert.ok(room.players[0].submittedTexts?.every((t) => t === "mango"));

  assert.equal(throwChits(room, "p1").ok, true);
  assert.equal(room.phase, "picking");
  assert.equal(room.pool.length, 12);

  const mango = room.pool.filter((c) => c.text === "mango").map((c) => c.id);
  const apple = room.pool.filter((c) => c.text === "apple").map((c) => c.id);
  const berry = room.pool.filter((c) => c.text === "berry").map((c) => c.id);

  // Live claim: first mango for p1
  assert.equal(claimChit(room, "p1", mango[0]).ok, true);
  assert.equal(room.pool.length, 11);
  // Same id cannot be claimed again
  assert.equal(claimChit(room, "p2", mango[0]).ok, false);
  assert.equal(releaseChit(room, "p1", mango[0]).ok, true);
  assert.equal(room.pool.length, 12);

  // Batch assign matching sets → immediate win for p1
  assert.equal(pickChits(room, "p1", mango).ok, true);
  assert.equal(pickChits(room, "p1", apple).ok, false);
  assert.equal(pickChits(room, "p2", apple).ok, true);
  assert.equal(pickChits(room, "p3", berry).ok, true);

  assert.equal(room.phase, "revealed");
  assert.equal(room.winnerId, "p1");

  // Pass flow with mixed hands
  const room2 = makeRoom();
  startWriting(room2);
  submitChits(room2, "p1", "x");
  submitChits(room2, "p2", "z");
  submitChits(room2, "p3", "y");
  throwChits(room2, "p1");

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
  pickChits(room2, "p3", room2.pool.slice(0, 4).map((c) => c.id));
  assert.equal(room2.phase, "passing");

  const p2hand = room2.players.find((p) => p.id === "p2")!.hand[0];
  assert.equal(passChit(room2, "p2", p2hand.id).ok, false);

  const p1 = room2.players.find((p) => p.id === "p1")!;
  const passY = p1.hand.find((c) => c.text === "y") ?? p1.hand[0];
  assert.equal(passChit(room2, "p1", passY.id).ok, true);

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

  console.log(
    "SMOKE PASSED — pick win:",
    room.winnerId,
    room2.phase === "revealed" ? `pass win: ${room2.winnerId}` : "pass API ok"
  );
}

main();
