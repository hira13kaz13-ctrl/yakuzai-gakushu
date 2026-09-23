import { useEffect, useMemo, useState } from "react";
import { ChoiceFeedbackList } from "../components/ChoiceFeedbackList";
import {
  TreatmentReview,
  type TreatmentReviewItem,
} from "../components/TreatmentReview";
import { loadTreatments } from "../data/loadTreatments";
import type { TreatmentProblem } from "../data/treatmentTypes";
import {
  TREATMENT_ROUND_SIZE,
  buildTreatmentRound,
  countPoolItems,
  listSources,
  type TreatmentQuestion,
  type TreatmentQuizVariant,
} from "../lib/treatmentQuiz";

type Phase = "setup" | "play" | "result";

type Props = {
  onHome: () => void;
  variant: TreatmentQuizVariant;
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

const COPY: Record<
  TreatmentQuizVariant,
  { title: string; blurb: string; ask: string; feedbackHeading: string; resultHint: string }
> = {
  policy: {
    title: "治療選択クイズ（治療方針）",
    blurb:
      "プロブレムとポイントから、より適切な治療方針（推奨文）を選びます。1ラウンド最大",
    ask: "この状況でより適切な治療方針はどれ？",
    feedbackHeading: "選択肢の解説（推奨／非推奨の出典）",
    resultHint: "下で推奨方針・薬剤・参照を復習できます。",
  },
  drug: {
    title: "治療選択クイズ（薬剤選択）",
    blurb:
      "プロブレムとポイントから、推奨される薬剤（一般名）を選びます。1ラウンド最大",
    ask: "この状況で推奨される薬剤はどれ？",
    feedbackHeading: "選択肢の解説（推奨薬剤の出典）",
    resultHint: "下で推奨薬剤・方針文・参照を復習できます。",
  },
};

export function TreatmentQuiz({ onHome, variant }: Props) {
  const copy = COPY[variant];
  const [problems, setProblems] = useState<TreatmentProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const [questions, setQuestions] = useState<TreatmentQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [history, setHistory] = useState<TreatmentReviewItem[]>([]);
  const [revealed, setRevealed] = useState<{
    ok: boolean;
    picked: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadTreatments();
        if (!cancelled) setProblems(data.problems);
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
    setPhase("setup");
    setQuestions([]);
    setIndex(0);
    setCorrectCount(0);
    setHistory([]);
    setRevealed(null);
    setError(null);
  }, [variant]);

  const sources = useMemo(() => listSources(problems), [problems]);

  const poolCount = useMemo(
    () => countPoolItems(problems, selectedSources, variant),
    [problems, selectedSources, variant],
  );

  const startRound = () => {
    const round = buildTreatmentRound(problems, selectedSources, variant);
    if (round.length === 0) {
      setError("選択範囲に出題できる項目がありません。");
      return;
    }
    setError(null);
    setQuestions(round);
    setIndex(0);
    setCorrectCount(0);
    setHistory([]);
    setRevealed(null);
    setPhase("play");
  };

  const current = questions[index] ?? null;

  const submit = (picked: string) => {
    if (!current || revealed) return;
    const ok = picked === current.answer;
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
    setRevealed(null);
  };

  if (loading) {
    return (
      <div className="quiz-screen">
        <div className="quiz-center">治療選択データを読み込み中…</div>
      </div>
    );
  }

  if (error && problems.length === 0) {
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
            <h2>{copy.title}</h2>
            <p>
              {copy.blurb} {TREATMENT_ROUND_SIZE} 問。
            </p>
          </header>

          <section className="quiz-block quiz-block-grow">
            <h3>領域タグ（未選択＝全件）</h3>
            <div className="quiz-chips">
              {sources.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${selectedSources.includes(s) ? "active" : ""}`}
                  onClick={() => setSelectedSources((prev) => toggle(prev, s))}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="quiz-meta">
              出題候補 {poolCount} 項目 · プロブレム {problems.length}
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
    return (
      <div className="quiz-screen">
        <div className="quiz-result with-review">
          <div className="result-summary">
            <h2>結果</h2>
            <p className="quiz-score compact">
              <strong>{correctCount}</strong>
              <span> / {questions.length}</span>
            </p>
            <p className="quiz-meta">{copy.resultHint}</p>
          </div>
          <TreatmentReview items={history} title="出題の復習" />
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

  if (!current) {
    return (
      <div className="quiz-screen">
        <div className="quiz-center">出題を準備できませんでした。</div>
      </div>
    );
  }

  return (
    <div className="quiz-screen">
      <div className="quiz-play">
        <div className="quiz-progress">
          <span>
            {index + 1} / {questions.length}
          </span>
          <span>正解 {correctCount}</span>
        </div>

        <div className="quiz-prompt tx-prompt">
          <span className="kubun-badge">{current.problem}</span>
          {current.point && current.point !== current.problem ? (
            <>
              <span className="tx-prompt-sep" aria-hidden>
                ›
              </span>
              <span className="tx-point">{current.point}</span>
            </>
          ) : null}
        </div>
        <p className="tx-q">{copy.ask}</p>

        {!revealed ? (
          <div className="quiz-choices tx-choices">
            {current.choices.map((c) => (
              <button
                key={c}
                type="button"
                className="quiz-choice tx-choice"
                onClick={() => submit(c)}
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          <div
            className={`quiz-feedback ${revealed.ok ? "ok" : "ng"} tx-feedback with-choices`}
          >
            <p className="quiz-feedback-title">
              {revealed.ok ? "正解" : "不正解"}
            </p>
            <ChoiceFeedbackList
              heading={copy.feedbackHeading}
              items={current.choiceMetas.map((m) => {
                const picked = m.text === revealed.picked && !m.isAnswer;
                const roleLabel =
                  variant === "drug"
                    ? m.isAnswer
                      ? "推奨薬剤"
                      : m.role === "avoid"
                        ? "候補外・混同しやすい薬剤"
                        : "別状況の推奨薬剤"
                    : m.role === "recommend"
                      ? "推奨方針"
                      : "非推奨方針";
                return {
                  key: `${m.problem}-${m.point}-${m.role}-${m.text.slice(0, 24)}`,
                  title: m.text,
                  subtitle: `${m.problem} · ${m.point} · ${roleLabel}`,
                  body: [
                    m.isAnswer
                      ? variant === "drug"
                        ? "この問題の正解（推奨薬剤）です。"
                        : "この問題の正解（推奨）です。"
                      : variant === "drug"
                        ? m.role === "avoid"
                          ? "このポイントの推奨セットには含まれない薬剤です。"
                          : "別のプロブレム／ポイントの推奨薬剤です。混同に注意。"
                        : m.role === "avoid"
                          ? "非推奨・避けるべき方針の文です。"
                          : "別のプロブレム／ポイントの推奨文です。混同に注意。",
                    m.policyText && variant === "drug"
                      ? `方針: ${m.policyText}`
                      : "",
                    m.drugText && variant === "policy" && m.drugText !== m.text
                      ? `推奨薬: ${m.drugText}`
                      : "",
                    m.ref ? `参照: ${m.ref}` : "",
                  ]
                    .filter(Boolean)
                    .join("\n"),
                  tags: [
                    m.role === "recommend" ? "推奨" : "注意",
                    m.isAnswer ? "正解" : "",
                  ].filter(Boolean),
                  tone: m.isAnswer
                    ? ("correct" as const)
                    : picked
                      ? ("picked" as const)
                      : ("other" as const),
                };
              })}
            />
            {current.contra ? (
              <p className="quiz-feedback-sub">禁忌・強い制約: {current.contra}</p>
            ) : null}
            <button type="button" className="quiz-btn primary" onClick={goNext}>
              {index + 1 >= questions.length ? "結果・復習へ" : "次の問題"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
