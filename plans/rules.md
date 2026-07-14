# Chit Game — Rules

Multiplayer party game for **3–8 players**. Play in a browser room with a shared code. No accounts.

## Goal

Be the first player to hold **exactly four chits with the same text**, then **reveal** them to win.

Two chits match if their text is the same after **trim + lowercase**.

## Seating

- Players sit in a fixed circle in join order.
- **Right-hand neighbor** = next player clockwise in that order.
- The **thrower** is the room host (the player who created the room).

## Phases

### 1. Lobby

1. One player creates a room (becomes host/thrower) and shares the **6-character room code**.
2. Others join with the code and a nickname.
3. Host starts the game when there are **at least 3** and at most **8** players.

### 2. Writing (fold your chits)

1. Each player secretly writes **exactly 4** non-empty chit texts.
2. Chits are “folded”: other players cannot read them.
3. When every player has submitted 4 chits, the game moves to throwing.

### 3. Throwing

1. All submitted chits are combined into one pool.
2. Only the **thrower** can press **Throw**.
3. The server shuffles the pool (digital “throw up”).

### 4. Picking

1. The shuffled pool is shown to everyone.
2. Each player must pick **exactly 4** chits from the pool.
3. You **cannot** pick more than 4.
4. You **cannot** take a chit another player already claimed.
5. When every player has confirmed 4 chits, passing begins. The thrower takes the **first turn**.

### 5. Passing

1. On your turn, choose **exactly one** chit from your hand and pass it to the player on your **right**.
2. After the pass: you have one fewer chit; your right-hand neighbor has one more.
3. Turn moves to that right-hand neighbor (clockwise).
4. After every pass, the server checks for a winner.

### 6. Win and reveal

1. If any player holds **exactly 4** chits and **all four match**, they win.
2. Their four matching chits are **revealed** to the whole room.
3. Host may start a new round (same room / players) from lobby or writing, depending on the app’s “Play again” action.

## Chat

- Room chat uses **only curated Tollywood reaction GIFs**.
- No free-text chat and no Unicode emoji picker in this version.

## Disconnects

- If a player disconnects, they are removed from the room.
- If fewer than **3** players remain mid-game, the room returns to **lobby** and the round is cancelled.
- If the host disconnects, the next remaining player in seat order becomes host/thrower.
- If the current-turn player disconnects during passing, turn passes to the next clockwise player still in the room.

## Fair play

- All picks, passes, and wins are validated on the **server**. Clients cannot force illegal moves.
- Only the current-turn player may pass.
- Only the thrower may throw during the throwing phase.
