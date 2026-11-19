// src/utils/scoreLogic.ts
export interface ScoreForm {
  id?: number | string;
  formId?: number;
  formTitle?: string;
  formDesc?: string;
  formType?: string;
  maxscore?: number;
  score?: number;
  scorePercentage: number | null;
  completed_at?: string | null;
  started_at?: string | null;
  assignAt?: string | null;
  formStartDate?: string | null;
  taskId?: string;
  taskName?: string;
  taskassignmentid?: number;
  submissionStatus?: string | null;
}

export type FormStatus = "scored" | "awaiting" | "missing";

/** Statut: noté / en attente de note / non soumis */
export function getFormStatus(f: ScoreForm): FormStatus {
  if (f.scorePercentage != null) return "scored";
  if (f.completed_at) return "awaiting";
  return "missing";
}

/** Date chronologique (la plus fiable dispo) */
export function getFormTime(f: ScoreForm): number {
  return new Date(
    f.formStartDate || f.completed_at || f.assignAt || f.started_at || 0
  ).getTime();
}

export function getDisplayTitle(f: ScoreForm | null): string {
  return f?.formTitle || f?.taskName || "מבחן";
}

export function fmtDate(ts: number | string): string {
  return new Date(ts).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface ScoreStats {
  all: ScoreForm[];
  scored: ScoreForm[];
  awaiting: ScoreForm[];
  missing: ScoreForm[];
  avg: number | null;
  best: ScoreForm | null;
  worst: ScoreForm | null;
  last: ScoreForm | null;
  prev: ScoreForm | null;
  delta: number | null; // dernier - précédent
  last5Avg: number | null;
  trend: "up" | "down" | "stable" | "na";
}

export function computeScoreStats(forms: ScoreForm[]): ScoreStats {
  const all = [...forms].sort((a, b) => getFormTime(a) - getFormTime(b));
  const scored = all.filter((f) => getFormStatus(f) === "scored");
  const awaiting = all.filter((f) => getFormStatus(f) === "awaiting");
  const missing = all.filter((f) => getFormStatus(f) === "missing");

  const values = scored.map((f) => f.scorePercentage as number);
  const avg = values.length
    ? values.reduce((s, v) => s + v, 0) / values.length
    : null;

  const best = scored.reduce<ScoreForm | null>(
    (b, f) =>
      !b || (f.scorePercentage as number) > (b.scorePercentage as number)
        ? f
        : b,
    null
  );
  const worst = scored.reduce<ScoreForm | null>(
    (w, f) =>
      !w || (f.scorePercentage as number) < (w.scorePercentage as number)
        ? f
        : w,
    null
  );

  const last = scored[scored.length - 1] ?? null;
  const prev = scored.length > 1 ? scored[scored.length - 2] : null;
  const delta =
    last && prev
      ? (last.scorePercentage as number) - (prev.scorePercentage as number)
      : null;

  const last5 = scored.slice(-5);
  const last5Avg = last5.length
    ? last5.reduce((s, f) => s + (f.scorePercentage as number), 0) /
      last5.length
    : null;

  // Tendance: moyenne des 3 derniers vs moyenne des 3 précédents
  const winA = scored.slice(-6, -3);
  const winB = scored.slice(-3);
  const avgA = winA.length
    ? winA.reduce((s, f) => s + (f.scorePercentage as number), 0) / winA.length
    : null;
  const avgB = winB.length
    ? winB.reduce((s, f) => s + (f.scorePercentage as number), 0) / winB.length
    : null;

  let trend: ScoreStats["trend"] = "na";
  if (avgA != null && avgB != null) {
    if (avgB - avgA >= 4) trend = "up";
    else if (avgB - avgA <= -4) trend = "down";
    else trend = "stable";
  } else if (scored.length >= 2) {
    trend = "stable";
  }

  return {
    all,
    scored,
    awaiting,
    missing,
    avg,
    best,
    worst,
    last,
    prev,
    delta,
    last5Avg,
    trend,
  };
}
