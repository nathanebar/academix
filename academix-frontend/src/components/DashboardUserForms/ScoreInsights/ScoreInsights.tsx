// ScoreInsights.tsx
import { useMemo } from "react";
import style from "./ScoreInsights.module.css";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { getScoreColor } from "../../../utils/ScoreUlLi";
import { computeScoreStats, getDisplayTitle, ScoreForm } from "../scoreLogic";

interface Props {
  forms: ScoreForm[];
}

const BANDS = [
  { label: "85–100", min: 85, color: "#52c41a" },
  { label: "70–84", min: 70, color: "#1890ff" },
  { label: "50–69", min: 50, color: "#fa8c16" },
  { label: "0–49", min: 0, color: "#ff4d4f" },
];

const ScoreInsights = ({ forms = [] }: Props) => {
  const stats = useMemo(() => computeScoreStats(forms), [forms]);
  const {
    avg,
    best,
    last,
    prev,
    delta,
    last5Avg,
    trend,
    awaiting,
    missing,
    scored,
  } = stats;

  const distribution = useMemo(() => {
    return BANDS.map((b, i) => {
      const upper = i === 0 ? 101 : BANDS[i - 1].min; // borne haute exclusive
      const count = scored.filter((f) => {
        const p = f.scorePercentage as number;
        return p >= b.min && p < upper;
      }).length;
      return { ...b, count };
    });
  }, [scored]);

  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  if (forms.length === 0) {
    return (
      <div className={style.card}>
        <h3 className={style.title}>תובנות מהירות</h3>
        <div className={style.empty}>אין עדיין נתונים להצגה</div>
      </div>
    );
  }

  const trendMeta: any = {
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
  }[trend];

  const lastScore = last?.scorePercentage ?? null;
  const deltaColor =
    delta == null ? "#8c8c8c" : delta >= 0 ? "#52c41a" : "#ff4d4f";

  return (
    <div className={style.card}>
      {/* Header */}
      <div className={style.header}>
        <h3 className={style.title}>תובנות מהירות</h3>
        <span
          className={style.trendChip}
          style={{ color: trendMeta.color, background: trendMeta.bg }}
        >
          <trendMeta.Icon />
          {trendMeta.label}
        </span>
      </div>

      {/* Héro : dernier résultat */}
      {lastScore != null ? (
        <div className={style.hero}>
          <div>
            <div className={style.heroLabel}>
              המבחן האחרון <span>· {getDisplayTitle(last)}</span>
            </div>
            <div
              className={style.heroScore}
              style={{ color: getScoreColor(last?.scorePercentage ?? 0) }}
            >
              {Math.round(lastScore)}
              <small>%</small>
            </div>
          </div>
          <div className={style.heroMeta}>
            {delta != null && (
              <span
                className={style.deltaChip}
                style={{
                  color: deltaColor,
                  background:
                    deltaColor === "#8c8c8c"
                      ? "#f5f5f5"
                      : deltaColor === "#52c41a"
                      ? "#f6ffed"
                      : "#fff1f0",
                }}
              >
                {delta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {delta >= 0 ? "+" : ""}
                {Math.round(delta)}
                <span className={style.deltaUnit}>pts</span>
              </span>
            )}
            {avg != null && (
              <div className={style.heroCompare}>
                הממוצע הכללי: <b>{Math.round(avg)}</b>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={style.heroEmpty}>אין ציון למבחן האחרון עדיין</div>
      )}

      {/* KPI */}
      <div className={style.kpiGrid}>
        <div className={style.kpi}>
          <span>ממוצע כללי</span>
          <b>{avg != null ? Math.round(avg) : "—"}</b>
        </div>
        <div className={style.kpi}>
          <span>אחרונים 5</span>
          <b>{last5Avg != null ? Math.round(last5Avg) : "—"}</b>
        </div>
        <div className={style.kpi}>
          <span>הכי גבוה</span>
          <b style={{ color: getScoreColor(best?.scorePercentage ?? 0) }}>
            {best ? Math.round(best.scorePercentage as number) : "—"}
          </b>
        </div>
      </div>

      {/* Distribution */}
      {scored.length > 0 && (
        <div className={style.distSection}>
          <div className={style.sectionTitle}>התפלגות הציונים</div>
          {distribution.map((d) => (
            <div className={style.band} key={d.label}>
              <span className={style.bandLabel}>{d.label}</span>
              <div className={style.bandTrack}>
                <div
                  className={style.bandFill}
                  style={{
                    width: `${(d.count / maxCount) * 100}%`,
                    backgroundColor: d.color,
                  }}
                />
              </div>
              <span className={style.bandCount}>{d.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alertes */}
      {(awaiting.length > 0 || missing.length > 0) && (
        <div className={style.alerts}>
          {awaiting.length > 0 && (
            <span className={`${style.alert} ${style.alertPending}`}>
              <ClockCircleOutlined /> {awaiting.length} ממתינים לציון
            </span>
          )}
          {missing.length > 0 && (
            <span className={`${style.alert} ${style.alertMissing}`}>
              {missing.length} לא הוגשו
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreInsights;
