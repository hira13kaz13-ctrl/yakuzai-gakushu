import { useEffect, useState } from "react";
import type { TreatmentQuestion } from "../lib/treatmentQuiz";

export type TreatmentReviewItem = {
  question: TreatmentQuestion;
  ok: boolean;
  picked: string;
};

type Props = {
  items: TreatmentReviewItem[];
  title?: string;
};

export function TreatmentReview({ items, title = "復習" }: Props) {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setSelected(0);
  }, [items]);

  if (items.length === 0) {
    return <p className="quiz-meta">復習対象がありません。</p>;
  }

  const cur = items[Math.min(selected, items.length - 1)];
  const q = cur.question;

  return (
    <div className="game-review">
      <div className="game-review-head">
        <h3>{title}</h3>
        <span className="quiz-meta">{items.length} 問</span>
      </div>
      <div className="game-review-body">
        <aside className="game-review-list" aria-label="復習一覧">
          {items.map((item, i) => (
            <button
              key={item.question.id}
              type="button"
              className={`game-review-row ${i === selected ? "selected" : ""}`}
              onClick={() => setSelected(i)}
            >
              <span className="generic">{item.question.problem}</span>
              <span className="brand">{item.question.point}</span>
              <span className={`review-badge ${item.ok ? "ok" : "ng"}`}>
                {item.ok ? "正解" : "不正解"}
              </span>
            </button>
          ))}
        </aside>
        <article className="game-review-detail">
          <header className="game-review-detail-head">
            <h4>{q.problem}</h4>
            <p>{q.point}</p>
            <div className="game-review-meta">
              <span className={`review-badge ${cur.ok ? "ok" : "ng"}`}>
                {cur.ok ? "正解" : "不正解"}
              </span>
              {!cur.ok ? (
                <span className="review-note">選択: {cur.picked}</span>
              ) : null}
            </div>
          </header>
          <div className="game-review-scroll">
            {q.policyText ? (
              <section className="review-block pros">
                <h4>推奨方針</h4>
                <pre>{q.policyText}</pre>
              </section>
            ) : null}
            {q.drugText ? (
              <section className="review-block side-effects">
                <h4>推奨薬剤</h4>
                <pre>{q.drugText}</pre>
              </section>
            ) : null}
            {!q.policyText && !q.drugText ? (
              <section className="review-block pros">
                <h4>推奨</h4>
                <pre>{q.answer}</pre>
              </section>
            ) : null}
            {q.avoidText ? (
              <section className="review-block cons">
                <h4>非推奨</h4>
                <pre>{q.avoidText}</pre>
              </section>
            ) : null}
            {q.contra ? (
              <section className="review-block side-effects">
                <h4>禁忌・強い制約</h4>
                <pre>{q.contra}</pre>
              </section>
            ) : null}
            {q.drugs ? (
              <section className="review-block">
                <h4>関連薬剤（カタログ）</h4>
                <pre>{q.drugs}</pre>
              </section>
            ) : null}
            {q.ref ? (
              <section className="review-block">
                <h4>参照</h4>
                <pre>{q.ref}</pre>
              </section>
            ) : null}
            <p className="detail-hint">
              学習用要約です。個別処方・添付文書・ガイドラインの代替ではありません。
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
