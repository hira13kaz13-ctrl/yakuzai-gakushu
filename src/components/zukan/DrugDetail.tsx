import { useEffect, useState } from "react";
import { parseTags, toNumber, type Drug } from "../../data/types";

type TabId = "essentials" | "safety" | "usage" | "structure";

type DrugDetailProps = {
  drug: Drug | null;
  onTagClick: (tag: string) => void;
  onBackToList?: () => void;
};

function ScoreBar({ score }: { score: number | null }) {
  const n = score ?? 0;
  return (
    <div>
      <div className="score-bar" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={i < n ? "on" : ""} />
        ))}
      </div>
      <div className="score-label">
        {score == null ? "薬価スコア未設定" : `薬価スコア ${score} / 10`}
      </div>
    </div>
  );
}

function Section({
  title,
  body,
  className = "",
}: {
  title: string;
  body?: string;
  className?: string;
}) {
  if (!body?.trim()) return null;
  return (
    <section className={`section-card ${className}`.trim()}>
      <h4>{title}</h4>
      <pre>{body}</pre>
    </section>
  );
}

export function DrugDetail({ drug, onTagClick, onBackToList }: DrugDetailProps) {
  const [tab, setTab] = useState<TabId>("essentials");

  useEffect(() => {
    setTab("essentials");
  }, [drug?.id]);

  if (!drug) {
    return (
      <div className="detail-empty">
        <p>左の一覧から薬剤を選択してください。</p>
      </div>
    );
  }

  const indicationTags = parseTags(drug.indication_tags);
  const cautionTags = parseTags(drug.caution_tags);
  const contraTags = parseTags(drug.contra_tags);
  const sideEffectTags = parseTags(drug.side_effects);
  const priceScore = toNumber(drug.price_score);

  return (
    <article className="detail-panel">
      {onBackToList ? (
        <button type="button" className="nav-back mobile-toggle" onClick={onBackToList}>
          ← 一覧へ
        </button>
      ) : null}

      <h2 className="detail-title">{drug.generic}</h2>
      <p className="detail-brand">{drug.brand}</p>
      <div className="detail-id">{drug.id}</div>

      <dl className="meta-grid">
        <div className="meta-item">
          <dt>区分</dt>
          <dd>{drug.kubun}</dd>
        </div>
        <div className="meta-item">
          <dt>分類</dt>
          <dd>{drug.bunrui}</dd>
        </div>
        <div className="meta-item">
          <dt>剤形</dt>
          <dd>{drug.form || "—"}</dd>
        </div>
        <div className="meta-item">
          <dt>投与経路</dt>
          <dd>{drug.route || "—"}</dd>
        </div>
        <div className="meta-item">
          <dt>規格</dt>
          <dd>{drug.strength || "—"}</dd>
        </div>
        <div className="meta-item">
          <dt>注射/非注射</dt>
          <dd>{drug.injectable || "—"}</dd>
        </div>
      </dl>

      <div className="price-block">
        <p className="price-text">{drug.price || "薬価情報なし"}</p>
        <ScoreBar score={priceScore} />
      </div>

      {indicationTags.length > 0 ? (
        <div className="tag-section">
          <h3>適応タグ</h3>
          <div className="chip-row">
            {indicationTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip tag"
                onClick={() => onTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="tabs" role="tablist">
        {(
          [
            ["essentials", "要点"],
            ["safety", "副作用・注意"],
            ["usage", "使い方"],
            ["structure", "構造"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`tab ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tab-panel" role="tabpanel">
        {tab === "essentials" ? (
          <>
            <Section title="薬剤の説明" body={drug.description} />
            <Section title="メリット" body={drug.pros} className="pros" />
            <Section title="デメリット" body={drug.cons} className="cons" />
            <section className="section-card side-effects">
              <h4>副作用</h4>
              {sideEffectTags.length > 0 ? (
                <div className="chip-row">
                  {sideEffectTags.map((t) => (
                    <span key={t} className="chip danger">
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p>（登録なし）</p>
              )}
            </section>
            <Section title="薬効・作用機序" body={drug.mechanism} />
            <Section title="作用" body={drug.actions} />
          </>
        ) : null}

        {tab === "safety" ? (
          <>
            <section className="section-card side-effects">
              <h4>副作用</h4>
              {sideEffectTags.length > 0 ? (
                <div className="chip-row">
                  {sideEffectTags.map((t) => (
                    <span key={t} className="chip danger">
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p>（登録なし）</p>
              )}
            </section>
            <Section title="デメリット" body={drug.cons} className="cons" />
            {cautionTags.length > 0 ? (
              <section className="section-card caution">
                <h4>慎重投与（タグ）</h4>
                <div className="chip-row">
                  {cautionTags.map((t) => (
                    <span key={t} className="chip warn">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
            {contraTags.length > 0 ? (
              <section className="section-card contra">
                <h4>禁忌に近い制約（タグ）</h4>
                <div className="chip-row">
                  {contraTags.map((t) => (
                    <span key={t} className="chip danger">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
            <p className="detail-hint">
              学習用の要約です。添付文書の副作用・禁忌の代替ではありません。
              副作用は＃プロブレム形式（xlsx「副作用」列）。空欄時はデメリット等から自動抽出。
            </p>
          </>
        ) : null}

        {tab === "usage" ? (
          <>
            <Section title="適応" body={drug.indications} />
            <Section title="投与量・投与方法" body={drug.dose} />
            <Section title="代謝経路" body={drug.metabolism} />
          </>
        ) : null}

        {tab === "structure" ? (
          <>
            <Section title="構造" body={drug.structures} />
            <Section title="キー構造" body={drug.key_structure} />
            <section className="section-card">
              <h4>構造式</h4>
              <p>構造式画像は今後のバージョンで追加予定です。</p>
            </section>
          </>
        ) : null}
      </div>
    </article>
  );
}
