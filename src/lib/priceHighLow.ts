import { toNumber, type Drug } from "../data/types";

export const HL_ROUND_SIZE = 10;

export type HlGuess = "high" | "low";

export type HlRound = {
  cards: Drug[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function scoreOf(drug: Drug): number | null {
  return toNumber(drug.price_score);
}

/** price_score があり、連続で同点にならない列を組む（場＋次で ROUND 回比較） */
export function buildHlRound(drugs: Drug[], kubuns: string[]): Drug[] {
  let pool = drugs.filter((d) => scoreOf(d) != null);
  if (kubuns.length > 0) {
    pool = pool.filter((d) => kubuns.includes(d.kubun));
  }
  pool = shuffle(pool);
  if (pool.length < 2) return [];

  const need = HL_ROUND_SIZE + 1; // 比較N回 → カード N+1
  const out: Drug[] = [pool[0]];
  const used = new Set([pool[0].id]);

  // 貪欲に異なるスコアの次カードを拾う
  let guard = 0;
  while (out.length < need && guard < pool.length * 4) {
    guard += 1;
    const prev = scoreOf(out[out.length - 1])!;
    const cand = pool.find(
      (d) => !used.has(d.id) && scoreOf(d) !== prev,
    );
    if (!cand) {
      // 使えなければ未使用から再シャッフル試行
      const rest = shuffle(pool.filter((d) => !used.has(d.id)));
      const alt = rest.find((d) => scoreOf(d) !== prev);
      if (!alt) break;
      out.push(alt);
      used.add(alt.id);
      continue;
    }
    out.push(cand);
    used.add(cand.id);
  }

  return out.length >= 2 ? out : [];
}

export function judgeGuess(
  current: Drug,
  next: Drug,
  guess: HlGuess,
): { ok: boolean; relation: "high" | "low" | "same" } {
  const a = scoreOf(current);
  const b = scoreOf(next);
  if (a == null || b == null) {
    return { ok: false, relation: "same" };
  }
  if (b === a) return { ok: false, relation: "same" };
  const relation = b > a ? "high" : "low";
  return { ok: guess === relation, relation };
}
