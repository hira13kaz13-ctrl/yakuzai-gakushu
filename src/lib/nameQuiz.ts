import type { Drug } from "../data/types";

export type AskTarget = "generic" | "brand" | "mix";
export type AnswerMode = "choice" | "typed";

export type NameChoice = {
  label: string;
  drug: Drug;
  isAnswer: boolean;
};

export type QuizQuestion = {
  drug: Drug;
  ask: "generic" | "brand";
  promptLabel: string;
  answer: string;
  choices: string[];
  choiceDetails: NameChoice[];
  hints: {
    kubun: string;
    bunrui: string;
    description: string;
    mechanism: string;
    actions: string;
    tags: string;
  };
};

const ROUND_SIZE = 10;

export function getRoundSize(): number {
  return ROUND_SIZE;
}

/** 空白除去・NFKC・小文字化 */
export function normalizeAnswer(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[\s\u3000]/g, "")
    .toLowerCase();
}

/** 商品名の／区切り候補を含む正解セット */
export function answerCandidates(answer: string): string[] {
  const parts = answer
    .split(/[／/]/)
    .map((p) => normalizeAnswer(p))
    .filter(Boolean);
  const full = normalizeAnswer(answer);
  return [...new Set([full, ...parts].filter(Boolean))];
}

export function isTypedCorrect(input: string, answer: string): boolean {
  const n = normalizeAnswer(input);
  if (!n) return false;
  return answerCandidates(answer).includes(n);
}

function brandParts(brand: string): string[] {
  return brand
    .split(/[／/]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function maskNames(text: string, drug: Drug): string {
  if (!text) return "";
  let out = text;
  const names = [
    drug.generic,
    drug.brand,
    ...brandParts(drug.brand),
  ].filter(Boolean);
  names.sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (name.length < 2) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), "＿＿");
  }
  return out.trim();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickAsk(target: AskTarget): "generic" | "brand" {
  if (target === "generic") return "generic";
  if (target === "brand") return "brand";
  return Math.random() < 0.5 ? "generic" : "brand";
}

function buildChoiceDetails(
  pool: Drug[],
  correct: Drug,
  ask: "generic" | "brand",
): NameChoice[] {
  const answer = ask === "generic" ? correct.generic : correct.brand;
  const sameKubun = pool.filter(
    (d) => d.id !== correct.id && d.kubun === correct.kubun,
  );
  const others = pool.filter(
    (d) => d.id !== correct.id && d.kubun !== correct.kubun,
  );
  const distractorSource = [...shuffle(sameKubun), ...shuffle(others)];
  const details: NameChoice[] = [
    { label: answer, drug: correct, isAnswer: true },
  ];
  const seen = new Set([normalizeAnswer(answer)]);

  for (const d of distractorSource) {
    if (details.length >= 4) break;
    const label = ask === "generic" ? d.generic : d.brand;
    const key = normalizeAnswer(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    details.push({ label, drug: d, isAnswer: false });
  }

  if (details.length < 4) {
    for (const d of shuffle(pool)) {
      if (details.length >= 4) break;
      if (d.id === correct.id) continue;
      const label = ask === "generic" ? d.generic : d.brand;
      const key = normalizeAnswer(label);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      details.push({ label, drug: d, isAnswer: false });
    }
  }

  return shuffle(details);
}

function buildHints(drug: Drug) {
  return {
    kubun: drug.kubun,
    bunrui: drug.bunrui,
    description: maskNames(drug.description || "", drug),
    mechanism: maskNames(drug.mechanism || "", drug),
    actions: maskNames(drug.actions || "", drug),
    tags: drug.indication_tags || "",
  };
}

export function buildRound(
  drugs: Drug[],
  opts: {
    askTarget: AskTarget;
    kubuns: string[];
  },
): QuizQuestion[] {
  let pool = drugs.filter((d) => d.generic && d.brand);
  if (opts.kubuns.length > 0) {
    pool = pool.filter((d) => opts.kubuns.includes(d.kubun));
  }
  if (pool.length === 0) return [];

  const picked = shuffle(pool).slice(0, Math.min(ROUND_SIZE, pool.length));
  return picked.map((drug) => {
    const ask = pickAsk(opts.askTarget);
    const answer = ask === "generic" ? drug.generic : drug.brand;
    const choiceDetails = buildChoiceDetails(pool, drug, ask);
    return {
      drug,
      ask,
      promptLabel: ask === "generic" ? "一般名は？" : "商品名は？",
      answer,
      choices: choiceDetails.map((c) => c.label),
      choiceDetails,
      hints: buildHints(drug),
    };
  });
}

export function snip(text: string, n = 100): string {
  const t = (text || "").trim();
  if (!t) return "";
  return t.length > n ? `${t.slice(0, n)}…` : t;
}
