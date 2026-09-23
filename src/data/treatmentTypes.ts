export type TreatmentProblem = {
  problem: string;
  points: string[];
  recommend: Record<string, string>;
  /** ポイントごとの推奨薬剤（例: "ハロペリドール／クエチアピン"） */
  recommend_drugs?: Record<string, string>;
  avoid: Record<string, string>;
  contra?: string;
  ref?: string;
  drugs?: string;
  sources?: string[];
};

export type TreatmentsPayload = {
  asOf: string;
  count: number;
  problems: TreatmentProblem[];
};
