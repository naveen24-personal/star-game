import { useEffect, useMemo, useState } from "react";
import type { Card } from "@chit/shared";
import {
  RUMMY_MELD_PATTERN,
  allCardsInGroups,
  isValidMeld,
  isValidMeldGroups,
  isValidRummy4333,
} from "@chit/shared";
import { PlayingCard } from "./PlayingCard";

export const MELD_ZONE_IDS = ["set4", "set3a", "set3b", "set3c", "free"] as const;
export type MeldZoneId = (typeof MELD_ZONE_IDS)[number];

const ZONE_LABELS: Record<MeldZoneId, string> = {
  set4: "4",
  set3a: "3",
  set3b: "3",
  set3c: "3",
  free: "Arrange",
};

const ZONE_CAPACITY: Record<MeldZoneId, number> = {
  set4: 4,
  set3a: 3,
  set3b: 3,
  set3c: 3,
  free: 99,
};

type CardLayout = {
  zoneId: MeldZoneId;
  order: number;
  x: number;
  y: number;
};

type Props = {
  hand: Card[];
  onDiscard?: (cardId: string) => void;
  canDiscard: boolean;
};

export function RummyHandBoard({ hand, onDiscard, canDiscard }: Props) {
  const [layout, setLayout] = useState<Record<string, CardLayout>>({});
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    setLayout((prev) => {
      const next = { ...prev };
      let freeOrder = Object.values(next).filter((l) => l.zoneId === "free").length;
      for (const c of hand) {
        if (!next[c.id]) {
          next[c.id] = {
            zoneId: "free",
            order: freeOrder++,
            x: 20 + (freeOrder % 6) * 14,
            y: 10 + Math.floor(freeOrder / 6) * 18,
          };
        }
      }
      for (const id of Object.keys(next)) {
        if (!hand.some((c) => c.id === id)) delete next[id];
      }
      return next;
    });
  }, [hand]);

  const byZone = useMemo(() => {
    const map: Record<MeldZoneId, Card[]> = {
      set4: [],
      set3a: [],
      set3b: [],
      set3c: [],
      free: [],
    };
    const sorted = [...hand].sort((a, b) => {
      const la = layout[a.id];
      const lb = layout[b.id];
      if (!la || !lb) return 0;
      if (la.zoneId !== lb.zoneId) return la.zoneId.localeCompare(lb.zoneId);
      return la.order - lb.order;
    });
    for (const c of sorted) {
      const z = layout[c.id]?.zoneId ?? "free";
      map[z].push(c);
    }
    return map;
  }, [hand, layout]);

  const groups = [byZone.set4, byZone.set3a, byZone.set3b, byZone.set3c];
  const meldsValid = isValidMeldGroups(groups) && allCardsInGroups(hand, groups);
  const allPlaced = hand.every(
    (c) => layout[c.id] && layout[c.id].zoneId !== "free"
  );

  const onDragStart = (cardId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", cardId);
    setDragId(cardId);
  };

  const dropOnZone = (zoneId: MeldZoneId) => (e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain") || dragId;
    if (!cardId) return;
    setLayout((prev) => {
      const inZone = hand.filter((c) => (prev[c.id]?.zoneId ?? "free") === zoneId);
      if (inZone.length >= ZONE_CAPACITY[zoneId] && prev[cardId]?.zoneId !== zoneId) {
        return prev;
      }
      const order = inZone.length;
      return {
        ...prev,
        [cardId]: {
          zoneId,
          order,
          x: prev[cardId]?.x ?? 0,
          y: prev[cardId]?.y ?? 0,
        },
      };
    });
    setDragId(null);
  };

  const onFreeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain") || dragId;
    if (!cardId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLayout((prev) => ({
      ...prev,
      [cardId]: {
        zoneId: "free",
        order: prev[cardId]?.order ?? 0,
        x: Math.max(4, Math.min(88, x)),
        y: Math.max(4, Math.min(88, y)),
      },
    }));
    setDragId(null);
  };

  return (
    <div className="rummy-organizer">
      <p className="rummy-organizer__hint">
        Drag cards into <strong>4 · 3 · 3 · 3</strong> melds or place freely on the mat.{" "}
        {meldsValid && allPlaced ? (
          <span className="rummy-organizer__ok">Valid declare layout!</span>
        ) : (
          <span>Need valid sets (same rank) or runs (same suit, consecutive).</span>
        )}
      </p>

      <div className="rummy-meld-row">
        {(["set4", "set3a", "set3b", "set3c"] as MeldZoneId[]).map((zoneId) => {
          const cards = byZone[zoneId];
          const valid = cards.length > 0 && isValidMeld(cards);
          const full = cards.length >= ZONE_CAPACITY[zoneId];
          return (
            <div
              key={zoneId}
              className={`rummy-meld-slot ${valid ? "rummy-meld-slot--valid" : ""} ${full ? "rummy-meld-slot--full" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={dropOnZone(zoneId)}
            >
              <span className="rummy-meld-slot__label">{ZONE_LABELS[zoneId]}</span>
              <div className="rummy-meld-slot__cards">
                {cards.map((c) => (
                  <PlayingCard
                    key={c.id}
                    card={c}
                    size="sm"
                    draggable
                    onDragStart={onDragStart(c.id)}
                    onClick={canDiscard ? () => onDiscard?.(c.id) : undefined}
                    selected={canDiscard}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="rummy-free-mat"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onFreeDrop}
      >
        <span className="rummy-free-mat__label">Your mat — drag cards anywhere</span>
        {byZone.free.map((c) => {
          const pos = layout[c.id];
          return (
            <PlayingCard
              key={c.id}
              card={c}
              size="sm"
              draggable
              onDragStart={onDragStart(c.id)}
              onClick={canDiscard ? () => onDiscard?.(c.id) : undefined}
              className="rummy-free-mat__card"
              style={{
                left: `${pos?.x ?? 10}%`,
                top: `${pos?.y ?? 10}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function handMatches4333(hand: Card[], layout: Record<string, CardLayout>): boolean {
  const groups = ["set4", "set3a", "set3b", "set3c"].map((z) =>
    hand.filter((c) => layout[c.id]?.zoneId === z)
  );
  if (isValidMeldGroups(groups) && allCardsInGroups(hand, groups)) return true;
  return isValidRummy4333(hand);
}

export { RUMMY_MELD_PATTERN };
