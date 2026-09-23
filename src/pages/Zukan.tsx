import { useEffect, useMemo, useState } from "react";
import { FilterBar } from "../components/zukan/FilterBar";
import { DrugList } from "../components/zukan/DrugList";
import { DrugDetail } from "../components/zukan/DrugDetail";
import { loadDrugs } from "../data/loadDrugs";
import {
  KUBUN_ORDER,
  parseTags,
  toNumber,
  type Drug,
  type SortKey,
} from "../data/types";

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function kubunRank(k: string): number {
  const i = (KUBUN_ORDER as readonly string[]).indexOf(k);
  return i === -1 ? 999 : i;
}

export function Zukan() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [asOf, setAsOf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [selectedKubuns, setSelectedKubuns] = useState<string[]>([]);
  const [selectedBunrui, setSelectedBunrui] = useState("");
  const [injectable, setInjectable] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("generic");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadDrugs();
        if (cancelled) return;
        setDrugs(data.drugs);
        setAsOf(data.asOf || "");
        setSelectedId(data.drugs[0]?.id ?? null);
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

  const bunruis = useMemo(() => {
    const pool =
      selectedKubuns.length > 0
        ? drugs.filter((d) => selectedKubuns.includes(d.kubun))
        : drugs;
    return [...new Set(pool.map((d) => d.bunrui).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "ja"),
    );
  }, [drugs, selectedKubuns]);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of drugs) {
      for (const t of parseTags(d.indication_tags)) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
      .slice(0, 16)
      .map(([t]) => t);
  }, [drugs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = drugs.filter((d) => {
      if (selectedKubuns.length > 0 && !selectedKubuns.includes(d.kubun)) return false;
      if (selectedBunrui && d.bunrui !== selectedBunrui) return false;
      if (injectable && d.injectable !== injectable) return false;
      if (selectedTags.length > 0) {
        const tags = parseTags(d.indication_tags);
        if (!selectedTags.every((t) => tags.includes(t))) return false;
      }
      if (q) {
        const hay = `${d.generic} ${d.brand} ${d.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      if (sortKey === "kubun") {
        const kd = kubunRank(a.kubun) - kubunRank(b.kubun);
        if (kd !== 0) return kd;
        return a.generic.localeCompare(b.generic, "ja");
      }
      if (sortKey === "price_score") {
        const sa = toNumber(a.price_score) ?? -1;
        const sb = toNumber(b.price_score) ?? -1;
        if (sb !== sa) return sb - sa;
        return a.generic.localeCompare(b.generic, "ja");
      }
      if (sortKey === "usage_frequency") {
        const sa = toNumber(a.usage_frequency) ?? -1;
        const sb = toNumber(b.usage_frequency) ?? -1;
        if (sb !== sa) return sb - sa;
        return a.generic.localeCompare(b.generic, "ja");
      }
      return a.generic.localeCompare(b.generic, "ja");
    });

    return rows;
  }, [
    drugs,
    query,
    selectedKubuns,
    selectedBunrui,
    injectable,
    selectedTags,
    sortKey,
  ]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((d) => d.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((d) => d.id === selectedId) ?? null;

  const clearFilters = () => {
    setQuery("");
    setSelectedKubuns([]);
    setSelectedBunrui("");
    setInjectable("");
    setSelectedTags([]);
  };

  if (loading) return <div className="loading">薬剤データを読み込み中…</div>;
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div className={`zukan show-${mobileView}`}>
      <aside className="zukan-side">
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          kubuns={kubuns}
          selectedKubuns={selectedKubuns}
          onToggleKubun={(k) => {
            setSelectedKubuns((prev) => toggleValue(prev, k));
            setSelectedBunrui("");
          }}
          bunruis={bunruis}
          selectedBunrui={selectedBunrui}
          onBunruiChange={setSelectedBunrui}
          injectable={injectable}
          onInjectableChange={setInjectable}
          sortKey={sortKey}
          onSortChange={setSortKey}
          popularTags={popularTags}
          selectedTags={selectedTags}
          onToggleTag={(t) => setSelectedTags((prev) => toggleValue(prev, t))}
          onClearFilters={clearFilters}
        />
        <div className="result-meta">
          {filtered.length} / {drugs.length} 件
          {asOf ? ` · 薬価 ${asOf}` : ""}
        </div>
        <DrugList
          drugs={filtered}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setMobileView("detail");
          }}
        />
      </aside>
      <section className="zukan-detail">
        <DrugDetail
          drug={selected}
          onTagClick={(tag) => {
            setSelectedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
            setMobileView("list");
          }}
          onBackToList={() => setMobileView("list")}
        />
      </section>
    </div>
  );
}
