import { useEffect, useState } from "react";
import { parseTags, type Drug } from "../data/types";

export type ReviewItem = {
  drug: Drug;
  /** 正解 / 不正解 / クリア組 など */
  badge?: string;
  badgeTone?: "ok" | "ng" | "neutral";
  note?: string;
};

type GameDrugReviewProps = {
  items: ReviewItem[];
  title?: string;
};

function Block({ title, body, className = "" }: { title: string; body?: string; className?: string }) {
  if (!body?.trim()) return null;
  return (
    <section className={`review-block ${className}`.trim()}>
      <h4>{title}</h4>
      <pre>{body}</pre>
    </section>
  );
}

export function GameDrugReview({ items, title = "復習" }: GameDrugReviewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.drug.id ?? null);

  useEffect(() => {
    if (!items.some((i) => i.drug.id === selectedId)) {
      setSelectedId(items[0]?.drug.id ?? null);
    }
  }, [items, selectedId]);

  if (items.length === 0) {
    return <p className="quiz-meta">復習対象の薬剤がありません。</p>;
  }

  const current = items.find((i) => i.drug.id === selectedId) ?? items[0];
  const drug = current.drug;
  const tags = parseTags(drug.indication_tags);
  const sideEffectTags = parseTags(drug.side_effects);

  return (
    <div className="game-review">
      <div className="game-review-head">
        <h3>{title}</h3>
        <span className="quiz-meta">{items.length} 剤</span>
      </div>
      <div className="game-review-body">
        <aside className="game-review-list" aria-label="復習薬剤一覧">
          {items.map((item) => (
            <button
              key={item.drug.id}
              type="button"
              className={`game-review-row ${item.drug.id === drug.id ? "selected" : ""}`}
              onClick={() => setSelectedId(item.drug.id)}
            >
              <span className="generic">{item.drug.generic}</span>
              <span className="brand">{item.drug.brand}</span>
              {item.badge ? (
                <span className={`review-badge ${item.badgeTone || "neutral"}`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </aside>
        <article className="game-review-detail">
          <header className="game-review-detail-head">
            <h4>{drug.generic}</h4>
            <p>{drug.brand}</p>
            <div className="game-review-meta">
              <span className="kubun-badge">{drug.kubun}</span>
              <span>{drug.bunrui}</span>
              {current.note ? <span className="review-note">{current.note}</span> : null}
            </div>
            {tags.length > 0 ? (
              <div className="chip-row">
                {tags.slice(0, 8).map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </header>
          <div className="game-review-scroll">
            <Block title="薬剤の説明" body={drug.description} />
            <Block title="メリット" body={drug.pros} className="pros" />
            <Block title="デメリット" body={drug.cons} className="cons" />
            {sideEffectTags.length > 0 ? (
              <section className="review-block side-effects">
                <h4>副作用</h4>
                <div className="chip-row">
                  {sideEffectTags.map((t) => (
                    <span key={t} className="chip danger">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
            <Block title="薬効・作用機序" body={drug.mechanism} />
            <Block title="作用" body={drug.actions} />
            <Block title="適応" body={drug.indications} />
            <Block title="用量" body={drug.dose} />
          </div>
        </article>
      </div>
    </div>
  );
}
