import type { Drug } from "../../data/types";

type DrugListProps = {
  drugs: Drug[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function DrugList({ drugs, selectedId, onSelect }: DrugListProps) {
  if (drugs.length === 0) {
    return (
      <div className="drug-list">
        <p className="result-meta">該当する薬剤がありません。</p>
      </div>
    );
  }

  return (
    <div className="drug-list" role="listbox" aria-label="薬剤一覧">
      {drugs.map((d) => (
        <button
          key={d.id}
          type="button"
          role="option"
          aria-selected={d.id === selectedId}
          className={`drug-row ${d.id === selectedId ? "selected" : ""}`}
          onClick={() => onSelect(d.id)}
        >
          <span className="generic">{d.generic}</span>
          <span className="kubun-badge">{d.kubun}</span>
          <span className="brand">{d.brand}</span>
        </button>
      ))}
    </div>
  );
}
