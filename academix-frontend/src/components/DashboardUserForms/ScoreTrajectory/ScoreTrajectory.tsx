// ScoreTrajectory.tsx
import { useMemo, useState } from "react";
import style from "./ScoreTrajectory.module.css";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { getScoreColor } from "../../../utils/ScoreUlLi";
import {
  ScoreForm,
  FormStatus,
  computeScoreStats,
  getFormStatus,
  getDisplayTitle,
} from "../scoreLogic";
import { ScoreStats } from "../scoreLogic";

interface Props {
  forms: ScoreForm[];
  /** Appelé au clic sur un point / une barre pour ouvrir le formulaire. */
  onSelectForm?: (form: ScoreForm) => void;
}

const VB_W = 640;
const VB_H = 238;
const PAD_L = 40; // un peu plus large : place pour les labels Y complets
const PAD_R = 10;
const PAD_T = 16;
const PAD_B = 34;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;
const BASELINE = PAD_T + PLOT_H;
const PENDING_Y = BASELINE - 18;

/** Échelle Y : 0 → 100 par pas de 20 (comme demandé) */
const GRID = [0, 20, 40, 60, 80, 100];

interface TrendMeta {
  label: string;
  color: string;
  bg: string;
  Icon: React.ComponentType;
}

const TREND_META: Record<ScoreStats["trend"], TrendMeta> = {
  up: {
    label: "במגמת שיפור",
    color: "#52c41a",
    bg: "#f6ffed",
    Icon: ArrowUpOutlined,
  },
  down: {
    label: "במגמת ירידה",
    color: "#ff4d4f",
    bg: "#fff1f0",
    Icon: ArrowDownOutlined,
  },
  stable: {
    label: "יציב",
    color: "#8c8c8c",
    bg: "#f5f5f5",
    Icon: MinusOutlined,
  },
  na: {
    label: "מעט מדי נתונים",
    color: "#8c8c8c",
    bg: "#f5f5f5",
    Icon: MinusOutlined,
  },
};

const STATUS_LABEL: Record<FormStatus, string> = {
  scored: "ציון · לחץ לצפייה",
  awaiting: "ממתין לציון",
  missing: "לא הוגש",
};

interface Point {
  form: ScoreForm;
  status: FormStatus;
  x: number;
  y: number;
}

const getTimeOf = (f: ScoreForm) => {
  const t =
    f.completed_at || f.formStartDate || f.assignAt || f.started_at || 0;
  return typeof t === "number" ? t : new Date(t).getTime();
};

const ScoreTrajectory = ({ forms = [], onSelectForm }: Props) => {
  const [hover, setHover] = useState<Point | null>(null);

  const stats = useMemo(() => computeScoreStats(forms), [forms]);

  const points = useMemo<Point[]>(() => {
    const n = stats.all.length;
    return stats.all.map((form: { scorePercentage: any }, i: number) => {
      const status = getFormStatus(form);
      const x = PAD_L + (n === 1 ? 0.5 : i / (n - 1)) * PLOT_W;
      const p = form.scorePercentage;
      const y = p != null ? BASELINE - (p / 100) * PLOT_H : PENDING_Y;
      return { form, status, x, y };
    });
  }, [stats.all]);

  const linePaths = useMemo(() => {
    const segments: Point[][] = [];
    let cur: Point[] = [];
    points.forEach((p) => {
      if (p.status === "scored") cur.push(p);
      else if (cur.length) {
        segments.push(cur);
        cur = [];
      }
    });
    if (cur.length) segments.push(cur);

    return segments.map((seg) => {
      const line = "M " + seg.map((p) => `${p.x} ${p.y}`).join(" L ");
      const area = `${line} L ${seg[seg.length - 1].x} ${BASELINE} L ${
        seg[0].x
      } ${BASELINE} Z`;
      return { line, area };
    });
  }, [points]);

  const dateTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(points.length / 5));
    const idx = points
      .map((_, i) => i)
      .filter((i) => i % step === 0 || i === points.length - 1);
    return idx.filter((v, i, a) => i === 0 || v !== a[i - 1]);
  }, [points]);

  /** Ouverture du formulaire (clic souris ou clavier) */
  const openForm = (p: Point) => {
    if (onSelectForm) onSelectForm(p.form);
  };

  const handleKey = (e: React.KeyboardEvent, p: Point) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openForm(p);
    }
  };

  if (forms.length === 0 || stats.scored.length === 0) {
    const allPending = stats.awaiting.length > 0;
    return (
      <div className={style.card}>
        <h3 className={style.title}>מסלול הציונים</h3>
        <div className={style.empty}>
          {allPending
            ? `${stats.awaiting.length} מבחנים ממתינים לציון`
            : "אין עדיין ציונים להצגה"}
        </div>
      </div>
    );
  }

  const trend: any = TREND_META[stats.trend];
  const deltaColor =
    stats.delta == null ? "#8c8c8c" : stats.delta >= 0 ? "#52c41a" : "#ff4d4f";

  return (
    <div className={style.card}>
      <div className={style.header}>
        <h3 className={style.title}>מסלול הציונים</h3>
        <span
          className={style.trendChip}
          style={{ color: trend.color, background: trend.bg }}
        >
          <trend.Icon />
          {trend.label}
        </span>
      </div>
      <div
        className={style.subtitle}
        style={{ display: "flex", gap: 8, alignItems: "center" }}
      >
        <span>מבוסס על {stats.scored.length} מבחנים</span>
        {onSelectForm && (
          <span className={style.clickHint}>
            · לחצו על נקודה כדי לפתוח את המבחן
          </span>
        )}
      </div>

      <div className={style.chartBox} onMouseLeave={() => setHover(null)}>
        <svg
          className={style.chart}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label="גרף התקדמות הציונים"
        >
          <defs>
            <linearGradient id="scoreArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52c41a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#52c41a" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grille horizontale + labels Y (0→100 pas de 20, tronqués à gauche = ok) */}
          {GRID.map((p) => {
            const y = BASELINE - (p / 100) * PLOT_H;
            return (
              <g key={p}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={PAD_L + PLOT_W}
                  y2={y}
                  stroke={p === 0 ? "#d8d2c4" : "#eee8da"}
                  strokeDasharray={p === 0 ? "" : "2 4"}
                />
                <text
                  x={PAD_L - 8}
                  y={y + 4}
                  fontSize={11}
                  fill="#b0a896"
                  textAnchor="end"
                  direction="ltr"
                >
                  {p}
                </text>
              </g>
            );
          })}

          {/* Aire + lignes */}
          {linePaths.map(({ area, line }, i) => (
            <g key={i}>
              <path d={area} fill="url(#scoreArea)" />
              <path
                d={line}
                fill="none"
                stroke="#52c41a"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Dates */}
          {dateTicks.map((i) => {
            const pt = points[i];
            return (
              <text
                key={i}
                x={pt.x}
                y={VB_H - 8}
                fontSize={10}
                fill="#a09a8c"
                textAnchor="middle"
                direction="ltr"
              >
                {new Date(getTimeOf(pt.form)).toLocaleDateString("he-IL", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </text>
            );
          })}

          {/* Points non notés (ambre = attente, gris = non soumis) */}
          {points
            .filter((p) => p.status !== "scored")
            .map((p, i) => (
              <g
                key={i}
                className={style.pointHit}
                tabIndex={onSelectForm ? 0 : undefined}
                role={onSelectForm ? "button" : undefined}
                aria-label={getDisplayTitle(p.form)}
                onClick={() => openForm(p)}
                onKeyDown={(e) => handleKey(e, p)}
              >
                {p.status === "awaiting" ? (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill="none"
                    stroke="#b45309"
                    strokeWidth={2}
                  />
                ) : (
                  <g stroke="#c9c2b2" strokeWidth={1.6}>
                    <line x1={p.x - 3} y1={p.y - 3} x2={p.x + 3} y2={p.y + 3} />
                    <line x1={p.x + 3} y1={p.y - 3} x2={p.x - 3} y2={p.y + 3} />
                  </g>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={12}
                  fill="transparent"
                  onMouseEnter={() => setHover(p)}
                />
              </g>
            ))}

          {/* Points notés + zones de clic */}
          {points.map((p, i) =>
            p.status === "scored" ? (
              <g
                key={i}
                className={style.pointHit}
                tabIndex={onSelectForm ? 0 : undefined}
                role={onSelectForm ? "button" : undefined}
                aria-label={`${getDisplayTitle(p.form)} - ${
                  p.form.scorePercentage
                }%`}
                onClick={() => openForm(p)}
                onKeyDown={(e) => handleKey(e, p)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={12}
                  fill="transparent"
                  onMouseEnter={() => setHover(p)}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4.5}
                  fill={getScoreColor(p.form.scorePercentage)}
                  stroke="#fff"
                  strokeWidth={1.5}
                  className={hover?.form === p.form ? style.dotActive : ""}
                />
              </g>
            ) : null
          )}
        </svg>

        {/* Tooltip */}
        {hover && (
          <div
            className={style.tooltip}
            style={{
              left: `${(hover.x / VB_W) * 100}%`,
              top: `${(hover.y / VB_H) * 100}%`,
              transform:
                hover.x > VB_W * 0.6
                  ? "translate(-100%, -115%)"
                  : "translate(-50%, -115%)",
            }}
            dir="rtl"
          >
            <div className={style.ttTitle}>
              <span
                className={style.ttDot}
                style={{
                  background:
                    hover.status === "scored"
                      ? getScoreColor(hover.form.scorePercentage)
                      : hover.status === "awaiting"
                      ? "#b45309"
                      : "#c9c2b2",
                }}
              />
              <b>{getDisplayTitle(hover.form)}</b>
            </div>
            <div
              className={style.ttStatus}
              style={{
                color: hover.status === "awaiting" ? "#b45309" : "#6e7072",
              }}
            >
              {STATUS_LABEL[hover.status]}
            </div>
            {hover.status === "scored" && (
              <div className={style.ttScore}>
                <strong>{hover.form.scorePercentage}%</strong>
                <span>
                  {hover.form.score} / {hover.form.maxscore}
                </span>
              </div>
            )}
            <div className={style.ttDate}>
              {new Date(getTimeOf(hover.form)).toLocaleDateString("he-IL")}
            </div>
          </div>
        )}
      </div>

      <div className={style.legendRow}>
        <span>
          <i className={style.filled} /> ציון
        </span>
        <span>
          <i className={style.pending} /> ממתין לציון
        </span>
        <span>
          <i className={style.missing} /> לא הוגש
        </span>
      </div>

      <div className={style.statsRow}>
        <div className={style.stat}>
          <span className={style.statLabel}>ממוצע כללי</span>
          <b>{Math.round(stats.avg ?? 0)}</b>
        </div>
        <div className={style.stat}>
          <span className={style.statLabel}>אחרון</span>
          <b style={{ color: getScoreColor(stats.last?.scorePercentage ?? 0) }}>
            {Math.round(stats.last?.scorePercentage ?? 0)}
          </b>
        </div>
        <div className={style.stat}>
          <span className={style.statLabel}>שינוי</span>
          <b style={{ color: deltaColor }}>
            {stats.delta == null
              ? "—"
              : `${stats.delta >= 0 ? "+" : ""}${Math.round(stats.delta)}`}
          </b>
        </div>
        <div className={style.stat}>
          <span className={style.statLabel}>הכי גבוה</span>
          <b style={{ color: getScoreColor(stats.best?.scorePercentage ?? 0) }}>
            {Math.round(stats.best?.scorePercentage ?? 0)}
          </b>
        </div>
      </div>
    </div>
  );
};

export default ScoreTrajectory;
