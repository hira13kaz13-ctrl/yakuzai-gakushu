type Mode = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

const MODES: Mode[] = [
  {
    id: "zukan",
    label: "薬剤図鑑",
    description: "薬剤情報の閲覧・検索・ソート。区分や適応タグで絞り込めます。",
    enabled: true,
  },
  {
    id: "name-quiz",
    label: "薬剤名クイズ",
    description: "薬剤情報から一般名または商品名を答えます。",
    enabled: true,
  },
  {
    id: "memory",
    label: "一般名・商品名 神経衰弱",
    description: "6組・12枚のカードで一般名と商品名をマッチさせます。",
    enabled: true,
  },
  {
    id: "treatment-policy",
    label: "治療選択（治療方針）",
    description: "プロブレムとポイントから、適切な治療方針の文章を選びます。",
    enabled: true,
  },
  {
    id: "treatment-drug",
    label: "治療選択（薬剤選択）",
    description: "プロブレムとポイントから、推奨される一般名を選びます。",
    enabled: true,
  },
  {
    id: "price-hl",
    label: "薬価 High / Low",
    description: "場の薬剤に対し、次の薬価スコアが高いか低いかを当てます。",
    enabled: true,
  },
];

type HomeProps = {
  onSelect: (modeId: string) => void;
};

export function Home({ onSelect }: HomeProps) {
  return (
    <div className="home">
      <section className="home-hero">
        <h1>薬剤学習</h1>
        <p>
          総合内科・精神科を中心に、カタログと治療選択を使って覚えるための学習アプリです。
          図鑑・クイズ・ゲームで知識を定着させましょう。
        </p>
      </section>
      <section className="mode-grid" aria-label="学習モード">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`mode-card ${mode.enabled ? "enabled" : "disabled"}`}
            disabled={!mode.enabled}
            onClick={() => mode.enabled && onSelect(mode.id)}
          >
            <span className={`mode-badge ${mode.enabled ? "" : "soon"}`.trim()}>
              {mode.enabled ? "利用可" : "準備中"}
            </span>
            <span className="mode-label">{mode.label}</span>
            <p className="mode-desc">{mode.description}</p>
          </button>
        ))}
      </section>
    </div>
  );
}
