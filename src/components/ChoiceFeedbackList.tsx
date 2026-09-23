type FeedbackItem = {
  key: string;
  title: string;
  subtitle?: string;
  body?: string;
  tags?: string[];
  /** correct | picked | distractor */
  tone: "correct" | "picked" | "other";
};

type Props = {
  items: FeedbackItem[];
  heading?: string;
};

export function ChoiceFeedbackList({
  items,
  heading = "選択肢の解説",
}: Props) {
  return (
    <div className="choice-fb">
      <h4 className="choice-fb-heading">{heading}</h4>
      <div className="choice-fb-list">
        {items.map((item) => (
          <article
            key={item.key}
            className={`choice-fb-item ${item.tone}`}
          >
            <div className="choice-fb-top">
              <span className={`choice-fb-badge ${item.tone}`}>
                {item.tone === "correct"
                  ? "正解"
                  : item.tone === "picked"
                    ? "あなたの選択"
                    : "他の選択肢"}
              </span>
              <strong className="choice-fb-title">{item.title}</strong>
            </div>
            {item.subtitle ? (
              <p className="choice-fb-sub">{item.subtitle}</p>
            ) : null}
            {item.tags && item.tags.length > 0 ? (
              <div className="chip-row">
                {item.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            {item.body ? <p className="choice-fb-body">{item.body}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
