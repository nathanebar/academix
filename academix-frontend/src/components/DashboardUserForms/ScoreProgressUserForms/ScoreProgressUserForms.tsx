import { useMemo, useState } from "react";
import style from "./ScoreProgressUserForms.module.css";
import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";
import { formType } from "../../../types/types";
import {
  getScoreColor,
  processRecentScoresForPieChart,
} from "../../../utils/ScoreUlLi";
import { scoresTitles } from "../ScoreChartUserForms/ScoreChartUserForms";
import { formatDate } from "../../../utils/formatDate";
import { Tooltip } from "antd";
import FormDiv from "../../../utils/FormDiv/FormDiv";

const FORMS_PER_PAGE = 10;

interface ScoreProgressProps {
  forms: formType[];
}

const getShortStatus = (form: formType) =>
  form.completed_at ? formatDate(form.completed_at) : "לא הוגש";

const getFullStatus = (form: formType) =>
  form.completed_at
    ? `ממתין לציון • ${formatDate(form.completed_at)}`
    : "לא הוגש";

const ScoreProgressUserForms = ({ forms = [] }: ScoreProgressProps) => {
  console.log(forms);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(forms.length / FORMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);

  const currentForms = useMemo(
    () =>
      forms.slice(safePage * FORMS_PER_PAGE, (safePage + 1) * FORMS_PER_PAGE),
    [forms, safePage]
  );

  const { counts } = useMemo(
    () => processRecentScoresForPieChart(currentForms),
    [currentForms]
  );

  const avgScore = useMemo(() => {
    if (currentForms.length === 0) return null;
    const total = currentForms.reduce(
      (s, f) => s + (f.scorePercentage ?? 0),
      0
    );
    return Math.round(total / currentForms.length);
  }, [currentForms]);

  const awaitingCount = currentForms.filter((f) => f.completed_at).length;
  const notSubmittedCount = currentForms.length - awaitingCount;

  const firstIndex = safePage * FORMS_PER_PAGE + 1;
  const lastIndex = Math.min((safePage + 1) * FORMS_PER_PAGE, forms.length);
  const isPrevDisabled = safePage <= 0;
  const isNextDisabled = safePage >= totalPages - 1;

  /* ---------- Header ---------- */
  const renderHeader = () => (
    <div className={style.header}>
      <h3 className={style.titleScore}>ציונים אחרונים</h3>
      <div className={style.arrowDiv}>
        <button
          type="button"
          className={style.arrowClass}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
          disabled={isPrevDisabled}
          aria-label="הקודמים"
        >
          <CaretRightOutlined className={style.arrowIcon} />
        </button>
        <div className={style.pageInfo}>
          {firstIndex}-{lastIndex} מתוך {forms.length}
        </div>
        <button
          type="button"
          className={style.arrowClass}
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={isNextDisabled}
          aria-label="הבאים"
        >
          <CaretLeftOutlined className={style.arrowIcon} />
        </button>
      </div>
    </div>
  );

  /* ---------- Légende (gauche) ---------- */
  const renderLegend = () => (
    <div className={style.legend}>
      {scoresTitles.map((item, index) => {
        const count = counts[item.title] || 0;
        return (
          <div
            key={`${item.title}-${index}`}
            className={`${style.legendItem} ${count > 0 ? style.active : ""}`}
          >
            <span
              className={style.legendDot}
              style={{ backgroundColor: item.color }}
            />
            <span className={style.legendLabel}>{item.title}</span>
            <span className={style.legendCount}>{count}</span>
          </div>
        );
      })}
    </div>
  );

  /* ---------- Barres + dates alignées ---------- */
  const renderChart = () => (
    <div className={style.chartArea}>
      {currentForms.map((val, index) => {
        const percent = val.scorePercentage ?? 0;
        const fullStatus = getFullStatus(val);
        return (
          <div className={style.formCell} key={val.id ?? index}>
            <Tooltip
              placement="top"
              title={<FormDiv byUser={true} form={val} />}
            >
              <div
                className={style.barTrack}
                role="img"
                aria-label={fullStatus}
                title={fullStatus}
              >
                <div
                  className={style.barFill}
                  style={{
                    height: `${percent}%`,
                    backgroundColor: val.completed_at
                      ? "#d4b106"
                      : getScoreColor(val.scorePercentage),
                  }}
                />
              </div>
            </Tooltip>
            <span className={style.barDate} title={fullStatus}>
              {getShortStatus(val)}
            </span>
          </div>
        );
      })}
    </div>
  );

  /* ---------- État vide ---------- */
  if (forms.length === 0) {
    return (
      <div className={style.bigBox}>
        <h3 className={style.titleScore}>ציונים אחרונים</h3>
        <div className={style.emptyState}>אין עדיין מבחנים להצגה</div>
      </div>
    );
  }

  return (
    <div className={style.bigBox}>
      {renderHeader()}

      <div className={style.summaryRow}>
        {avgScore !== null && (
          <span className={style.summaryChip}>
            ממוצע בעמוד: <strong>{avgScore}</strong>
          </span>
        )}
        {awaitingCount > 0 && (
          <span className={style.summaryChip}>
            ממתין לציון: <strong>{awaitingCount}</strong>
          </span>
        )}
        {notSubmittedCount > 0 && (
          <span className={style.summaryChip}>
            לא הוגש: <strong>{notSubmittedCount}</strong>
          </span>
        )}
      </div>

      <div className={style.progressContainer}>
        {renderLegend()}
        <div className={style.chartWrapper}>{renderChart()}</div>
      </div>
    </div>
  );
};

export default ScoreProgressUserForms;
