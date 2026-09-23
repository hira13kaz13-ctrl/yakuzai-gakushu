import { useEffect, useMemo, useState } from "react";
import { ChoiceFeedbackList } from "../components/ChoiceFeedbackList";
import { GameDrugReview, type ReviewItem } from "../components/GameDrugReview";
import { loadDrugs } from "../data/loadDrugs";
import { KUBUN_ORDER, type Drug } from "../data/types";
import { snip } from "../lib/nameQuiz";
import {
  HL_ROUND_SIZE,
  buildHlRound,
  judgeGuess,
  scoreOf,
  type HlGuess,
} from "../lib/priceHighLow";

type Phase = "setup" | "play" | "result";

type HistoryItem = {
  current: Drug;
  next: Drug;
  guess: HlGuess;
  ok: boolean;
  relation: "high" | "low" | "same";
};

type Props = {
  onHome: () => void;
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function ScorePips({ score }: { score: number | null }) {
  const n = score ?? 0;
  return (
    <div className="hl-pips" aria-label={score == null ? "未設定" : `${score}/10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < n ? "on" : ""} />
      ))}
    </div>
  );
}

export function PriceHighLow({ onHome }: Props) {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedKubuns, setSelectedKubuns] = useState<string[]>([]);

  const [deck, setDeck] = useState<Drug[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [revealed, setRevealed] = useState<HistoryItem | null>(null);

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

  const kubuns = useMemo(() => {
    const present = new Set(drugs.map((d) => d.kubun));
    return (KUBUN_ORDER as readonly string[]).filter((k) => present.has(k));
  }, [drugs]);

  const poolCount = useMemo(() => {
    let pool = drugs.filter((d) => scoreOf(d) != null);
    if (selectedKubuns.length > 0) {
      pool = pool.filter((d) => selectedKubuns.includes(d.kubun));
    }
    return pool.length;
  }, [drugs, selectedKubuns]);

  const totalSteps = Math.max(0, deck.length - 1);
  const current = deck[index] ?? null;
  const next = deck[index + 1] ?? null;

  const reviewItems: ReviewItem[] = useMemo(() => {
    const map = new Map<string, ReviewItem>();
    for (const h of history) {
      for (const d of [h.current, h.next]) {
        if (map.has(d.id)) continue;
        map.set(d.id, {
          drug: d,
          badge: `薬価 ${scoreOf(d) ?? "—"}`,
          badgeTone: "neutral",
          note: d.price || "",
        });
      }
    }
    return [...map.values()];
  }, [history]);

  const startRound = () => {
    const round = buildHlRound(drugs, selectedKubuns);
    if (round.length < 2) {
      setError("薬価スコア付きの薬剤が不足しています。");
      return;
    }
    setError(null);
    setDeck(round);
    setIndex(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setHistory([]);
    setRevealed(null);
    setPhase("play");
  };

  const submit = (guess: HlGuess) => {
    if (!current || !next || revealed) return;
    const { ok, relation } = judgeGuess(current, next, guess);
    const item: HistoryItem = { current, next, guess, ok, relation };
    if (ok) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const n = s + 1;
        setBestStreak((b) => Math.max(b, n));
        return n;
      });
    } else {
      setStreak(0);
    }
    setHistory((prev) => [...prev, item]);
    setRevealed(item);
  };

  const goNext = () => {
    if (index + 1 >= totalSteps) {
      setPhase("result");
      return;
    }
    setIndex((i) => i + 1);
    setRevealed(null);
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
            <h2>薬価 High / Low</h2>
            <p>
              場の薬剤に対し、次の薬剤の薬価スコア（1〜10）が高いか低いかを当てます。最大{" "}
              {HL_ROUND_SIZE} 問。
            </p>
          </header>

          <section className="quiz-block quiz-block-grow">
            <h3>区分（未選択＝全件）</h3>
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
              薬価スコアあり {poolCount} 剤
              {error ? ` · ${error}` : ""}
            </p>
          </section>

          <footer className="quiz-actions">
            <button
              type="button"
              className="quiz-btn primary"
              disabled={poolCount < 2}
              onClick={startRound}
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
            <h2>結果</h2>
            <p className="quiz-score compact">
              <strong>{correctCount}</strong>
              <span> / {history.length}</span>
            </p>
            <p className="quiz-meta">最大連続正解 {bestStreak}</p>
          </div>
          <GameDrugReview items={reviewItems} title="登場した薬剤の復習" />
          <div className="quiz-actions row">
            <button type="button" className="quiz-btn primary" onClick={startRound}>
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

  if (!current || !next) {
    return (
      <div className="quiz-screen">
        <div className="quiz-center">出題を準備できませんでした。</div>
      </div>
    );
  }

  return (
    <div className="quiz-screen">
      <div className="quiz-play hl-play">
        <div className="quiz-progress">
          <span>
            {index + 1} / {totalSteps}
          </span>
          <span>
            正解 {correctCount} · 連続 {streak}
          </span>
        </div>

        {!revealed ? (
          <>
            <div className="hl-stage">
              <article className="hl-card current">
                <span className="hl-label">場の薬剤</span>
                <h3>{current.generic}</h3>
                <p>{current.brand}</p>
                <span className="kubun-badge">{current.kubun}</span>
                <div className="hl-score-row">
                  <span>薬価スコア</span>
                  <strong>{scoreOf(current)}</strong>
                </div>
                <ScorePips score={scoreOf(current)} />
                <p className="hl-price">{current.price || ""}</p>
              </article>

              <div className="hl-vs">VS</div>

              <article className="hl-card next">
                <span className="hl-label">次の薬剤</span>
                <h3>{next.generic}</h3>
                <p>{next.brand}</p>
                <span className="kubun-badge">{next.kubun}</span>
                <p className="hl-hidden">薬価スコアは？</p>
              </article>
            </div>

            <p className="tx-q">次の薬剤の薬価スコアは、場より高い？低い？</p>
            <div className="hl-guess">
              <button
                type="button"
                className="quiz-btn primary hl-btn high"
                onClick={() => submit("high")}
              >
                HIGH
              </button>
              <button
                type="button"
                className="quiz-btn primary hl-btn low"
                onClick={() => submit("low")}
              >
                LOW
              </button>
            </div>
          </>
        ) : (
          <div className={`quiz-feedback ${revealed.ok ? "ok" : "ng"} with-choices`}>
            <p className="quiz-feedback-title">
              {revealed.ok ? "正解" : "不正解"}
              <span className="hl-relation">
                {" "}
                （次は {revealed.relation === "high" ? "HIGH" : "LOW"}）
              </span>
            </p>
            <div className="hl-stage compact">
              <article className="hl-card current mini">
                <span className="hl-label">場</span>
                <strong>{revealed.current.generic}</strong>
                <ScorePips score={scoreOf(revealed.current)} />
                <span className="hl-mini-score">{scoreOf(revealed.current)}</span>
              </article>
              <article className="hl-card next mini">
                <span className="hl-label">次</span>
                <strong>{revealed.next.generic}</strong>
                <ScorePips score={scoreOf(revealed.next)} />
                <span className="hl-mini-score">{scoreOf(revealed.next)}</span>
              </article>
            </div>
            <ChoiceFeedbackList
              heading="両方の薬剤情報"
              items={[revealed.current, revealed.next].map((d, i) => ({
                key: d.id,
                title: `${i === 0 ? "場" : "次"}: ${d.generic}`,
                subtitle: `${d.brand} · スコア ${scoreOf(d)} · ${d.kubun}`,
                body: [d.price || "", snip(d.description || d.mechanism || "", 100)]
                  .filter(Boolean)
                  .join("\n"),
                tags: [`薬価スコア ${scoreOf(d)}`],
                tone:
                  i === 1
                    ? revealed.ok
                      ? ("correct" as const)
                      : ("picked" as const)
                    : ("other" as const),
              }))}
            />
            <button type="button" className="quiz-btn primary" onClick={goNext}>
              {index + 1 >= totalSteps ? "結果・復習へ" : "次へ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
