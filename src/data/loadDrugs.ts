import type { DrugsPayload } from "./types";

export async function loadDrugs(): Promise<DrugsPayload> {
  const url = `${import.meta.env.BASE_URL}data/drugs.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `薬剤データの読み込みに失敗しました (${res.status}). build_xlsx.py で drugs.json を生成してください。`,
    );
  }
  const data = (await res.json()) as DrugsPayload;
  if (!data?.drugs || !Array.isArray(data.drugs)) {
    throw new Error("drugs.json の形式が不正です。");
  }
  return data;
}
