import type { SortKey } from "../../data/types";

type FilterBarProps = {
  query: string;
  onQueryChange: (v: string) => void;
  kubuns: string[];
  selectedKubuns: string[];
  onToggleKubun: (k: string) => void;
  bunruis: string[];
  selectedBunrui: string;
  onBunruiChange: (v: string) => void;
  injectable: string;
  onInjectableChange: (v: string) => void;
  sortKey: SortKey;
  onSortChange: (v: SortKey) => void;
  popularTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearFilters: () => void;
};

export function FilterBar({
  query,
  onQueryChange,
  kubuns,
  selectedKubuns,
  onToggleKubun,
  bunruis,
  selectedBunrui,
  onBunruiChange,
  injectable,
  onInjectableChange,
  sortKey,
  onSortChange,
  popularTags,
  selectedTags,
  onToggleTag,
  onClearFilters,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-field">
        <label htmlFor="drug-search">検索</label>
        <input
          id="drug-search"
          type="search"
          placeholder="一般名・商品名・ID"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="filter-field">
        <label>区分</label>
        <div className="chip-row" role="group" aria-label="区分フィルタ">
          {kubuns.map((k) => (
            <button
              key={k}
              type="button"
              className={`chip ${selectedKubuns.includes(k) ? "active" : ""}`}
              onClick={() => onToggleKubun(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-field">
          <label htmlFor="bunrui">分類</label>
          <select
            id="bunrui"
            value={selectedBunrui}
            onChange={(e) => onBunruiChange(e.target.value)}
          >
            <option value="">すべて</option>
            {bunruis.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="injectable">注射/非注射</label>
          <select
            id="injectable"
            value={injectable}
            onChange={(e) => onInjectableChange(e.target.value)}
          >
            <option value="">すべて</option>
            <option value="非注射">非注射</option>
            <option value="注射">注射</option>
            <option value="注射・非注射">注射・非注射</option>
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="sort">ソート</label>
          <select
            id="sort"
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
          >
            <option value="generic">一般名</option>
            <option value="kubun">区分</option>
            <option value="price_score">薬価スコア</option>
            <option value="usage_frequency">使用頻度</option>
          </select>
        </div>
      </div>

      {popularTags.length > 0 ? (
        <div className="filter-field">
          <label>適応タグ（頻出）</label>
          <div className="chip-row">
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`chip ${selectedTags.includes(tag) ? "active" : ""}`}
                onClick={() => onToggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {(selectedKubuns.length > 0 ||
        selectedBunrui ||
        injectable ||
        selectedTags.length > 0 ||
        query) && (
        <button type="button" className="nav-back" onClick={onClearFilters}>
          フィルタをクリア
        </button>
      )}
    </div>
  );
}
