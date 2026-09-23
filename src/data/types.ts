export type Drug = {
  id: string;
  kubun: string;
  bunrui: string;
  generic: string;
  brand: string;
  injectable?: string;
  route?: string;
  form?: string;
  strength?: string;
  specialty?: string;
  usage_frequency?: number | string | null;
  indication_tags?: string;
  caution_tags?: string;
  contra_tags?: string;
  actions?: string;
  structures?: string;
  key_structure?: string;
  pros?: string;
  cons?: string;
  side_effects?: string;
  mechanism?: string;
  description?: string;
  indications?: string;
  dose?: string;
  metabolism?: string;
  price?: string;
  price_score?: number | string | null;
};

export type DrugsPayload = {
  asOf: string;
  count: number;
  drugs: Drug[];
};

export type SortKey = "generic" | "kubun" | "price_score" | "usage_frequency";

export const KUBUN_ORDER = [
  "循環",
  "呼吸器",
  "消化器",
  "神経",
  "血液",
  "免疫",
  "内分泌代謝",
  "抗菌薬",
  "皮膚",
  "産婦",
  "泌尿器",
  "眼科",
  "耳鼻咽喉科",
  "その他",
] as const;

export function parseTags(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s　]+/)
    .map((t) => t.trim())
    .filter((t) => t.startsWith("#") || t.startsWith("＃"))
    .map((t) => t.replace(/^＃/, "#"));
}

export function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
