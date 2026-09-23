import { useEffect, useMemo, useState } from "react";
import { GameDrugReview, type ReviewItem } from "../components/GameDrugReview";
import { loadDrugs } from "../data/loadDrugs";
import { KUBUN_ORDER, type Drug } from "../data/types";
import {
  MEMORY_PAIRS,
  isMatch,
  pickMemoryCards,
  type MemoryCard,
} from "../lib/memoryGame";

type Phase = "setup" | "play" | "result";

type MemoryGameProps = {
  onHome: () => void;
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

const MISMATCH_MS = 700;

export function MemoryGame({ onHome }: MemoryGameProps) {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedKubuns, setSelectedKubuns] = useState<string[]>([]);

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadDrugs();
        if (!cancelled) setDrugs(data.drugs);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "play" || startedAt == null) return;
    const t = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(t);
  }, [phase, startedAt]);

  const kubuns = useMemo(() => {
    const present = new Set(drugs.map((d) => d.kubun));
    return (KUBUN_ORDER as readonly string[]).filter((k) => present.has(k));
  }, [drugs]);

  const poolCount = useMemo(() => {
    const base =
      selectedKubuns.length === 0
        ? drugs
        : drugs.filter((d) => selectedKubuns.includes(d.kubun));
    return base.filter((d) => d.generic?.trim() && d.brand?.trim()).length;
  }, [drugs, selectedKubuns]);

  const drugById = useMemo(() => new Map(drugs.map((d) => [d.id, d])), [drugs]);

  const reviewItems: ReviewItem[] = useMemo(() => {
    const ids = [...new Set(cards.map((c) => c.pairId))];
    return ids
      .map((id) => drugById.get(id))
      .filter((d): d is Drug => Boolean(d))
      .map((drug) => ({
        drug,
        badge: "クリア",
        badgeTone: "ok" as const,
        note: `${drug.generic} ＝ ${drug.brand}`,
      }));
  }, [cards, drugById]);

  const startGame = () => {
    const next = pickMemoryCards(drugs, selectedKubuns);
    if (next.length < MEMORY_PAIRS * 2) {
      setError("出題できる薬剤が不足しています。");
      return;
    }
    setError(null);
    setCards(next);
    setFlipped([]);
    setMatched([]);
    setLock(false);
    setMoves(0);
    setStartedAt(Date.now());
    setElapsedSec(0);
    setPhase("play");
  };

  const onFlip = (card: MemoryCard) => {
    if (lock || phase !== "play") return;
    if (flipped.includes(card.id) || matched.includes(card.pairId)) return;
    if (flipped.length >= 2) return;

    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);

    if (nextFlipped.length < 2) return;

    setMoves((m) => m + 1);
    const [aId, bId] = nextFlipped;
    const a = cards.find((c) => c.id === aId)!;
    const b = cards.find((c) => c.id === bId)!;
    setLock(true);

    if (isMatch(a, b)) {
      const nextMatched = [...matched, a.pairId];
      setMatched(nextMatched);
      setFlipped([]);
      setLock(false);
      if (nextMatched.length >= MEMORY_PAIRS) {
        setPhase("result");
      }
      return;
    }

    window.setTimeout(() => {
      setFlipped([]);
      setLock(false);
    }, MISMATCH_MS);
  };

  if (loading) {
    return (
      <div className="quiz-screen">
        <div className="quiz-center">薬剤データを読み込み中…</div>
      </div>
    );
  }

  if (error && drugs.length === 0) {
    return (
      <div className="quiz-screen">
        <div className="quiz-center error-box">{error}</div>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="quiz-screen">
        <div className="quiz-setup">
          <header className="quiz-head">
            <h2>一般名・商品名 神経衰弱</h2>
            <p>
              {MEMORY_PAIRS} 組・{MEMORY_PAIRS * 2}{" "}
              枚。同じ薬剤の一般名と商品名を揃えます。クリア後に復習できます。
            </p>
          </header>

          <section className="quiz-block quiz-block-grow">
            <h3>区分（未選択＝全件からランダム）</h3>
            <div className="quiz-chips">
              {kubuns.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`chip ${selectedKubuns.includes(k) ? "active" : ""}`}
                  onClick={() => setSelectedKubuns((prev) => toggle(prev, k))}
                >
                  {k}
                </button>
              ))}
            </div>
            <p className="quiz-meta">
              候補 {poolCount} 剤（必要 {MEMORY_PAIRS} 剤）
              {error ? ` · ${error}` : ""}
            </p>
          </section>

          <footer className="quiz-actions">
            <button
              type="button"
              className="quiz-btn primary"
              disabled={poolCount < 1}
              onClick={startGame}
            >
              スタート
            </button>
          </footer>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="quiz-screen">
        <div className="quiz-result with-review">
          <div className="result-summary">
            <h2>クリア</h2>
            <p className="quiz-score compact">
              <strong>{moves}</strong>
              <span>
                {" "}
                手 · {elapsedSec}s
              </span>
            </p>
          </div>
          <GameDrugReview items={reviewItems} title="揃えた薬剤の復習" />
          <div className="quiz-actions row">
            <button type="button" className="quiz-btn primary" onClick={startGame}>
              もう一度
            </button>
            <button type="button" className="quiz-btn" onClick={() => setPhase("setup")}>
              設定に戻る
            </button>
            <button type="button" className="quiz-btn" onClick={onHome}>
              ホーム
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-screen">
      <div className="memory-play">
        <div className="quiz-progress">
          <span>
            揃えた組 {matched.length} / {MEMORY_PAIRS}
          </span>
          <span>
            {moves} 手 · {elapsedSec}s
          </span>
        </div>

        <div className="memory-board" role="grid" aria-label="神経衰弱カード">
          {cards.map((card) => {
            const isOpen =
              flipped.includes(card.id) || matched.includes(card.pairId);
            const isDone = matched.includes(card.pairId);
            return (
              <button
                key={card.id}
                type="button"
                className={[
                  "memory-card",
                  isOpen ? "open" : "",
                  isDone ? "done" : "",
                  card.kind,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onFlip(card)}
                disabled={lock || isDone}
                aria-pressed={isOpen}
              >
                <span className="memory-card-face back">?</span>
                <span className="memory-card-face front">
                  <span className="memory-kind">
                    {card.kind === "generic" ? "一般名" : "商品名"}
                  </span>
                  <span className="memory-label">{card.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
