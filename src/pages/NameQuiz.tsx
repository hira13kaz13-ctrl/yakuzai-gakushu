import { useEffect, useMemo, useState } from "react";
import { ChoiceFeedbackList } from "../components/ChoiceFeedbackList";
import { GameDrugReview, type ReviewItem } from "../components/GameDrugReview";
import { loadDrugs } from "../data/loadDrugs";
import { KUBUN_ORDER, type Drug } from "../data/types";
import {
  buildRound,
  getRoundSize,
  isTypedCorrect,
  snip,
  type AnswerMode,
  type AskTarget,
  type QuizQuestion,
} from "../lib/nameQuiz";

type Phase = "setup" | "play" | "result";

type AnswerRecord = {
  question: QuizQuestion;
  ok: boolean;
  picked: string;
};

type NameQuizProps = {
  onHome: () => void;
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function NameQuiz({ onHome }: NameQuizProps) {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("setup");
  const [askTarget, setAskTarget] = useState<AskTarget>("mix");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("choice");
  const [selectedKubuns, setSelectedKubuns] = useState<string[]>([]);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [history, setHistory] = useState<AnswerRecord[]>([]);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState<{
    ok: boolean;
    picked: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadDrugs();
        if (!cancelled) setDrugs(data.drugs);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
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
    if (selectedKubuns.length === 0) return drugs.length;
    return drugs.filter((d) => selectedKubuns.includes(d.kubun)).length;
  }, [drugs, selectedKubuns]);

  const reviewItems: ReviewItem[] = useMemo(() => {
    const map = new Map<string, ReviewItem>();
    for (const h of history) {
      if (h.question.choiceDetails.length === 0) {
        map.set(h.question.drug.id, {
          drug: h.question.drug,
          badge: h.ok ? "正解" : "不正解",
          badgeTone: h.ok ? "ok" : "ng",
          note: `${h.question.promptLabel} → ${h.question.answer}`,
        });
        continue;
      }
      for (const c of h.question.choiceDetails) {
        const isAsked = c.drug.id === h.question.drug.id;
        if (map.has(c.drug.id) && !isAsked) continue;
        map.set(c.drug.id, {
          drug: c.drug,
          badge: isAsked
            ? h.ok
              ? "出題・正解"
              : "出題・不正解"
            : "選択肢",
          badgeTone: isAsked ? (h.ok ? "ok" : "ng") : "neutral",
          note: `${c.drug.generic} ／ ${c.drug.brand}`,
        });
      }
    }
    return [...map.values()];
  }, [history]);

  const startRound = () => {
    const round = buildRound(drugs, {
      askTarget,
      kubuns: selectedKubuns,
    });
    if (round.length === 0) {
      setError("選択した範囲に出題できる薬剤がありません。");
      return;
    }
    setError(null);
    setQuestions(round);
    setIndex(0);
    setCorrectCount(0);
    setHistory([]);
    setTyped("");
    setRevealed(null);
    setPhase("play");
  };

  const current = questions[index] ?? null;

  const submitAnswer = (picked: string) => {
    if (!current || revealed) return;
    const ok =
      answerMode === "choice"
        ? picked === current.answer
        : isTypedCorrect(picked, current.answer);
    if (ok) setCorrectCount((c) => c + 1);
    setHistory((prev) => [...prev, { question: current, ok, picked }]);
    setRevealed({ ok, picked });
  };

  const goNext = () => {
    if (index + 1 >= questions.length) {
      setPhase("result");
      return;
    }
    setIndex((i) => i + 1);
    setTyped("");
    setRevealed(null);
  };

  if (loading) {
    return (
      <div className="quiz-screen">
        <div className="quiz-center">薬剤データを読み込み中…</div>
      </div>
    );
  }

  if (error && phase === "setup" && drugs.length === 0) {
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
            <h2>薬剤名クイズ</h2>
            <p>ヒントから一般名または商品名を答えます。1ラウンド {getRoundSize()} 問。</p>
          </header>

          <section className="quiz-block">
            <h3>出題</h3>
            <div className="quiz-seg">
              {(
                [
                  ["generic", "一般名"],
                  ["brand", "商品名"],
                  ["mix", "ミックス"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`quiz-seg-btn ${askTarget === id ? "active" : ""}`}
                  onClick={() => setAskTarget(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="quiz-block">
            <h3>答え方</h3>
            <div className="quiz-seg">
              {(
                [
                  ["choice", "4択"],
                  ["typed", "自由入力"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`quiz-seg-btn ${answerMode === id ? "active" : ""}`}
                  onClick={() => setAnswerMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

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
              出題候補 {poolCount} 剤
              {error ? ` · ${error}` : ""}
            </p>
          </section>

          <footer className="quiz-actions">
            <button
              type="button"
              className="quiz-btn primary"
              disabled={poolCount === 0}
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
    const total = questions.length;
    return (
      <div className="quiz-screen">
        <div className="quiz-result with-review">
          <div className="result-summary">
            <h2>結果</h2>
            <p className="quiz-score compact">
              <strong>{correctCount}</strong>
              <span> / {total}</span>
            </p>
            <p className="quiz-meta">出題薬と選択肢に出た薬剤をまとめて復習できます。</p>
          </div>
          <GameDrugReview items={reviewItems} title="出題・選択肢の復習" />
          <div className="quiz-actions row">
            <button type="button" className="quiz-btn primary" onClick={startRound}>
              もう一度
            </button>
            <button
              type="button"
              className="quiz-btn"
              onClick={() => {
                setPhase("setup");
                setRevealed(null);
              }}
            >
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

  if (!current) {
    return (
      <div className="quiz-screen">
        <div className="quiz-center">出題を準備できませんでした。</div>
      </div>
    );
  }

  const hintBody =
    current.hints.description ||
    current.hints.mechanism ||
    "（説明文なし）";

  const choiceFbItems =
    answerMode === "choice"
      ? current.choiceDetails.map((c) => {
          const picked = Boolean(
            revealed && c.label === revealed.picked && !c.isAnswer,
          );
          return {
            key: c.drug.id,
            title: c.label,
            subtitle: `${c.drug.generic} ／ ${c.drug.brand} · ${c.drug.kubun} · ${c.drug.bunrui}`,
            body:
              snip(c.drug.description || "") ||
              snip(c.drug.mechanism || "") ||
              snip(c.drug.pros || ""),
            tags: [c.isAnswer ? "正解の薬剤" : "比較対象"],
            tone: c.isAnswer
              ? ("correct" as const)
              : picked
                ? ("picked" as const)
                : ("other" as const),
          };
        })
      : [
          {
            key: current.drug.id,
            title: current.answer,
            subtitle: `${current.drug.generic} ／ ${current.drug.brand}`,
            body:
              snip(current.drug.description || "", 160) ||
              snip(current.drug.mechanism || "", 160),
            tone: "correct" as const,
          },
        ];

  return (
    <div className="quiz-screen">
      <div className="quiz-play">
        <div className="quiz-progress">
          <span>
            {index + 1} / {questions.length}
          </span>
          <span>正解 {correctCount}</span>
        </div>

        <div className="quiz-prompt">
          <span className="kubun-badge">{current.hints.kubun}</span>
          <span className="quiz-ask">{current.promptLabel}</span>
        </div>

        {!revealed ? (
          <>
            <div className="quiz-hint-card">
              <div className="quiz-hint-meta">
                <strong>{current.hints.bunrui}</strong>
                {current.hints.tags ? (
                  <span className="quiz-hint-tags">{current.hints.tags}</span>
                ) : null}
              </div>
              <p className="quiz-hint-body">{hintBody}</p>
              {current.hints.actions ? (
                <p className="quiz-hint-sub">作用: {current.hints.actions}</p>
              ) : null}
            </div>

            {answerMode === "choice" ? (
              <div className="quiz-choices">
                {current.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="quiz-choice"
                    onClick={() => submitAnswer(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <form
                className="quiz-typed"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAnswer(typed);
                }}
              >
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={
                    current.ask === "generic" ? "一般名を入力" : "商品名を入力"
                  }
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="quiz-btn primary"
                  disabled={!typed.trim()}
                >
                  回答
                </button>
              </form>
            )}
          </>
        ) : (
          <div className={`quiz-feedback ${revealed.ok ? "ok" : "ng"} with-choices`}>
            <p className="quiz-feedback-title">
              {revealed.ok ? "正解" : "不正解"}
            </p>
            <ChoiceFeedbackList items={choiceFbItems} />
            <button type="button" className="quiz-btn primary" onClick={goNext}>
              {index + 1 >= questions.length ? "結果・復習へ" : "次の問題"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
