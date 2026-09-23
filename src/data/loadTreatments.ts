import type { TreatmentsPayload } from "./treatmentTypes";

export async function loadTreatments(): Promise<TreatmentsPayload> {
  const url = `${import.meta.env.BASE_URL}data/treatments.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `治療選択データの読み込みに失敗しました (${res.status}). build_xlsx.py で treatments.json を生成してください。`,
    );
  }
  const data = (await res.json()) as TreatmentsPayload;
  if (!data?.problems || !Array.isArray(data.problems)) {
    throw new Error("treatments.json の形式が不正です。");
  }
  return data;
}
