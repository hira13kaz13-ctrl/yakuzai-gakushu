import type { TreatmentProblem } from "../data/treatmentTypes";

export const TREATMENT_ROUND_SIZE = 8;

export type TreatmentQuizVariant = "policy" | "drug";

export type TreatmentChoiceMeta = {
  text: string;
  role: "recommend" | "avoid";
  problem: string;
  point: string;
  isAnswer: boolean;
  ref?: string;
  drugs?: string;
  policyText?: string;
  drugText?: string;
};

export type TreatmentQuestion = {
  id: string;
  variant: TreatmentQuizVariant;
  problem: string;
  point: string;
  answer: string;
  choices: string[];
  choiceMetas: TreatmentChoiceMeta[];
  policyText: string;
  drugText: string;
  avoidText: string;
  contra: string;
  ref: string;
  drugs: string;
  sources: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type PoolItem = {
  problem: TreatmentProblem;
  point: string;
  policyText: string;
  drugText: string;
  answer: string;
};

function buildPool(
  problems: TreatmentProblem[],
  sourceFilter: string[],
  variant: TreatmentQuizVariant,
): PoolItem[] {
  const filtered =
    sourceFilter.length === 0
      ? problems
      : problems.filter((p) =>
          (p.sources || []).some((s) => sourceFilter.includes(s)),
        );

  const pool: PoolItem[] = [];
  for (const problem of filtered) {
    const points =
      problem.points?.length > 0
        ? problem.points
        : Object.keys(problem.recommend || {});
    for (const point of points) {
      const policyText = (problem.recommend?.[point] || "").trim();
      const drugText = (problem.recommend_drugs?.[point] || "").trim();
      if (variant === "policy") {
        if (!policyText) continue;
        pool.push({
          problem,
          point,
          policyText,
          drugText,
          answer: policyText,
        });
      } else {
        if (!drugText) continue;
        pool.push({
          problem,
          point,
          policyText,
          drugText,
          answer: drugText,
        });
      }
    }
  }
  return pool;
}

function collectPolicyDistractors(
  pool: PoolItem[],
  current: PoolItem,
): TreatmentChoiceMeta[] {
  const seen = new Set([current.answer]);
  const out: TreatmentChoiceMeta[] = [];

  const avoidSame = (current.problem.avoid?.[current.point] || "").trim();
  if (avoidSame && !seen.has(avoidSame)) {
    out.push({
      text: avoidSame,
      role: "avoid",
      problem: current.problem.problem,
      point: current.point,
      isAnswer: false,
      ref: current.problem.ref,
      drugs: current.problem.drugs,
      policyText: avoidSame,
      drugText: "",
    });
    seen.add(avoidSame);
  }

  const others = shuffle(
    pool.filter(
      (p) =>
        !(
          p.problem.problem === current.problem.problem &&
          p.point === current.point
        ),
    ),
  );

  for (const o of others) {
    if (out.length >= 3) break;
    if (!seen.has(o.answer)) {
      out.push({
        text: o.answer,
        role: "recommend",
        problem: o.problem.problem,
        point: o.point,
        isAnswer: false,
        ref: o.problem.ref,
        drugs: o.problem.drugs,
        policyText: o.policyText,
        drugText: o.drugText,
      });
      seen.add(o.answer);
    }
    if (out.length >= 3) break;
    const av = (o.problem.avoid?.[o.point] || "").trim();
    if (av && !seen.has(av)) {
      out.push({
        text: av,
        role: "avoid",
        problem: o.problem.problem,
        point: o.point,
        isAnswer: false,
        ref: o.problem.ref,
        drugs: o.problem.drugs,
        policyText: av,
        drugText: "",
      });
      seen.add(av);
    }
  }
  return out.slice(0, 3);
}

function splitDrugs(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split("／")
    .map((s) => s.trim())
    .filter(Boolean);
}

function collectDrugDistractors(
  pool: PoolItem[],
  current: PoolItem,
): TreatmentChoiceMeta[] {
  const seen = new Set([current.answer]);
  const out: TreatmentChoiceMeta[] = [];
  const answerSet = new Set(splitDrugs(current.drugText));

  const pushMeta = (
    text: string,
    role: "recommend" | "avoid",
    problem: TreatmentProblem,
    point: string,
    policyText: string,
    drugText: string,
  ) => {
    const t = text.trim();
    if (!t || seen.has(t) || out.length >= 3) return;
    // 正解セットと完全一致、または正解と同一成分のみの並び替えは除外
    const set = new Set(splitDrugs(t));
    if (
      set.size === answerSet.size &&
      [...set].every((d) => answerSet.has(d))
    ) {
      return;
    }
    seen.add(t);
    out.push({
      text: t,
      role,
      problem: problem.problem,
      point,
      isAnswer: false,
      ref: problem.ref,
      drugs: problem.drugs,
      policyText,
      drugText,
    });
  };

  // 1) 同プロブレム・他ポイントの推奨薬剤セット（最優先）
  const sameProblemOthers = shuffle(
    pool.filter(
      (p) =>
        p.problem.problem === current.problem.problem &&
        p.point !== current.point &&
        Boolean(p.drugText),
    ),
  );
  for (const o of sameProblemOthers) {
    pushMeta(
      o.drugText,
      "recommend",
      o.problem,
      o.point,
      o.policyText,
      o.drugText,
    );
  }

  // 2) 同プロブレムのカタログ薬から、正解に含まれない単独薬
  const sameCatalog = shuffle(
    splitDrugs(current.problem.drugs).filter((d) => !answerSet.has(d)),
  );
  for (const name of sameCatalog) {
    pushMeta(
      name,
      "avoid",
      current.problem,
      current.point,
      current.policyText,
      name,
    );
  }

  // 3) 不足分のみ他プロブレムの推奨薬剤セット
  if (out.length < 3) {
    const others = shuffle(
      pool.filter(
        (p) =>
          p.problem.problem !== current.problem.problem && Boolean(p.drugText),
      ),
    );
    for (const o of others) {
      pushMeta(
        o.drugText,
        "recommend",
        o.problem,
        o.point,
        o.policyText,
        o.drugText,
      );
    }
  }

  return out.slice(0, 3);
}

export function listSources(problems: TreatmentProblem[]): string[] {
  const set = new Set<string>();
  for (const p of problems) {
    for (const s of p.sources || []) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ja"));
}

export function countPoolItems(
  problems: TreatmentProblem[],
  sourceFilter: string[],
  variant: TreatmentQuizVariant,
): number {
  return buildPool(problems, sourceFilter, variant).length;
}

export function buildTreatmentRound(
  problems: TreatmentProblem[],
  sourceFilter: string[],
  variant: TreatmentQuizVariant = "policy",
): TreatmentQuestion[] {
  const pool = buildPool(problems, sourceFilter, variant);
  if (pool.length === 0) return [];

  const picked = shuffle(pool).slice(
    0,
    Math.min(TREATMENT_ROUND_SIZE, pool.length),
  );

  return picked.map((item, i) => {
    const answerMeta: TreatmentChoiceMeta = {
      text: item.answer,
      role: "recommend",
      problem: item.problem.problem,
      point: item.point,
      isAnswer: true,
      ref: item.problem.ref,
      drugs: item.problem.drugs,
      policyText: item.policyText,
      drugText: item.drugText,
    };
    const distractors =
      variant === "policy"
        ? collectPolicyDistractors(pool, item)
        : collectDrugDistractors(pool, item);
    const choiceMetas = shuffle([answerMeta, ...distractors]);
    return {
      id: `${variant}-${item.problem.problem}-${item.point}-${i}`,
      variant,
      problem: item.problem.problem,
      point: item.point,
      answer: item.answer,
      choices: choiceMetas.map((c) => c.text),
      choiceMetas,
      policyText: item.policyText,
      drugText: item.drugText,
      avoidText: (item.problem.avoid?.[item.point] || "").trim(),
      contra: item.problem.contra || "",
      ref: item.problem.ref || "",
      drugs: item.problem.drugs || "",
      sources: item.problem.sources || [],
    };
  });
}
