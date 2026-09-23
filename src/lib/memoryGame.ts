import type { Drug } from "../data/types";

export const MEMORY_PAIRS = 6;

export type CardKind = "generic" | "brand";

export type MemoryCard = {
  id: string;
  pairId: string;
  kind: CardKind;
  label: string;
  drugId: string;
};

export function pickMemoryCards(
  drugs: Drug[],
  kubuns: string[],
): MemoryCard[] {
  let pool = drugs.filter((d) => d.generic?.trim() && d.brand?.trim());
  if (kubuns.length > 0) {
    pool = pool.filter((d) => kubuns.includes(d.kubun));
  }
  if (pool.length < MEMORY_PAIRS) {
    // 足りないときは全件から補完
    const ids = new Set(pool.map((d) => d.id));
    for (const d of drugs) {
      if (pool.length >= MEMORY_PAIRS) break;
      if (!d.generic?.trim() || !d.brand?.trim() || ids.has(d.id)) continue;
      pool.push(d);
      ids.add(d.id);
    }
  }

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const picked = shuffled.slice(0, MEMORY_PAIRS);
  const cards: MemoryCard[] = [];
  for (const d of picked) {
    cards.push({
      id: `${d.id}-g`,
      pairId: d.id,
      kind: "generic",
      label: d.generic,
      drugId: d.id,
    });
    cards.push({
      id: `${d.id}-b`,
      pairId: d.id,
      kind: "brand",
      label: d.brand,
      drugId: d.id,
    });
  }

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function isMatch(a: MemoryCard, b: MemoryCard): boolean {
  return a.pairId === b.pairId && a.kind !== b.kind;
}
