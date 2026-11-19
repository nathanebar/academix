import style from "./ScoreChartUserForms.module.css";
import { feedbackType, formType } from "../../../types/types";
import {
  groupFeedbacksByScoreCategory,
  processRecentScoresForPieChart,
} from "../../../utils/ScoreUlLi";
import { useState } from "react";
import { FileTextOutlined } from "@ant-design/icons";
import { Popover } from "antd";

export const scoresTitles = [
  { title: "(0-20)", color: "#FC523E" },
  { title: "(20-40)", color: "#FFA52D" },
  { title: "(40-60)", color: "#FFD12D" },
  { title: "(60-80)", color: "#44C7A5" },
  { title: "(80-100)", color: "#29A182" },
];

const feedbackTitles = [
  { title: "0-20", color: "#FC523E" },
  { title: "20-40", color: "#FFA52D" },
  { title: "40-60", color: "#FFD12D" },
  { title: "60-80", color: "#44C7A5" },
  { title: "80-100", color: "#29A182" },
];

interface ChartPors {
  forms?: formType[] | null;
  feedbacks?: feedbackType[] | null;
  isTeam?: boolean;
}
const getFeedbackDetailsByCategory = (feedbacks: feedbackType[]) => {
  const detailsByCategory: Record<string, any[]> = {
    "0-20": [],
    "20-40": [],
    "40-60": [],
    "60-80": [],
    "80-100": [],
  };

  feedbacks.forEach((feedback) => {
    feedback.answers?.forEach((answer) => {
      const grade = answer.summary_grade;
      let category = "";

      if (grade <= 20) category = "0-20";
      else if (grade <= 40) category = "20-40";
      else if (grade <= 60) category = "40-60";
      else if (grade <= 80) category = "60-80";
      else category = "80-100";

      detailsByCategory[category].push({
        feedbackName: feedback.feedbackName,
        memberName: answer.memberName || "לא ידוע",
        taskName: answer.taskName || "לא ידוע",
        grade: grade,
      });
    });
  });

  return detailsByCategory;
};

const ScoreChartUserForms = (props: ChartPors) => {
  let pieData: { name: string; value: number }[] = [];
  let counts: any = {};
  let sortByScore: any = {};
  let titlesToUse = scoresTitles;


  const [isModalOpen, setIsModalOpen] = useState(false);
  const isFeedback = props.feedbacks && props.feedbacks.length > 0;
  const feedbackDetailsByCategory = isFeedback
    ? getFeedbackDetailsByCategory(props.feedbacks!)
    : {};

  const FeedbackTooltipContent = ({ category }: { category: string }) => {
    const items = feedbackDetailsByCategory[category] || [];

    if (items.length === 0) {
      return (
        <div style={{ padding: "10px", textAlign: "center" }}>אין נתונים</div>
      );
    }

    return (
      <div className={style.tooltipContent}>
        <div className={style.tooltipHeader}>
          <span>פירוט {category}</span>
          <span>({items.length} משובים)</span>
        </div>
        <div className={style.tooltipList}>
          {items.map((item, index) => (
            <div key={index} className={style.tooltipItem}>
              <div className={style.tooltipRow}>
                <span className={style.tooltipLabel}>שם משוב:</span>
                <span className={style.tooltipValue}>{item.feedbackName}</span>
              </div>
              <div className={style.tooltipRow}>
                <span className={style.tooltipLabel}>שם החניך:</span>
                <span className={style.tooltipValue}>{item.memberName}</span>
              </div>
              <div className={style.tooltipRow}>
                <span className={style.tooltipLabel}>שם התרגיל:</span>
                <span className={style.tooltipValue}>{item.taskName}</span>
              </div>
              <div className={style.tooltipRow}>
                <span className={style.tooltipLabel}>ציון:</span>
                <span className={style.tooltipGrade}>{item.grade}</span>
              </div>
              {index < items.length - 1 && (
                <div className={style.tooltipDivider} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (props.feedbacks && props.feedbacks.length > 0) {
    const processedData = processRecentScoresForPieChart(props.feedbacks);

    pieData = processedData.pieData;
    counts = processedData.counts;
    sortByScore = groupFeedbacksByScoreCategory(props.feedbacks);
    titlesToUse = feedbackTitles;
  } else if (props.forms && props.forms.length > 0) {
    const processedData = processRecentScoresForPieChart(props.forms);

    pieData = processedData.pieData;
    counts = processedData.counts;
    sortByScore = processRecentScoresForPieChart(props.forms);
    titlesToUse = scoresTitles;
  }

  return (
    <div
      className={
        props.forms && props.forms?.length > 0
          ? style["containerForForms"]
          : style["container"]
      }
    >
      {props.isTeam ? (
        <h3 className={style["scoreTitle"]}> גרף ציונים ממוצע צוותי </h3>
      ) : (
        <h3 className={style["scoreTitle"]}> גרף ציונים ממוצע </h3>
      )}

      <div
        className={
          props.forms && props.forms?.length > 0
            ? style["scoreDivUl"]
            : style["scoreDivUlForFeedback"]
        }
      >
        <div
          className={
            props.forms && props.forms?.length > 0
              ? style["scoreUl"]
              : style["scoreUlForFeedback"]
          }
        >
          {isFeedback ? (
            // Vertical display for feedback
            <>
              {(() => {
                const countsTyped = counts as Record<string, number>;
                const total = Object.values(countsTyped).reduce(
                  (a, b) => a + b,
                  0
                );

                return (
                  <div className={style.feedbackBarChart}>
                    {titlesToUse.map((value, index) => {
                      const count = countsTyped[value.title] || 0;
                      const percentage =
                        total > 0 ? Math.round((count / total) * 100) : 0;

                      return (
                        <Popover
                          content={
                            <FeedbackTooltipContent category={value.title} />
                          }
                          title={null}
                          trigger="hover"
                          placement="left"
                          overlayClassName={style.feedbackTooltip}
                        >
                          <div key={index} className={style.barRow}>
                            <div className={style.barLabel}>
                              <span
                                className={style.barDot}
                                style={{ backgroundColor: value.color }}
                              />
                              <span className={style.barTitle}>
                                {value.title}
                              </span>
                            </div>
                            <div className={style.barContainer}>
                              <div
                                className={style.barFill}
                                style={{
                                  width: count > 0 ? `${percentage}%` : "0%",
                                  backgroundColor: value.color,
                                }}
                              />
                            </div>
                            <div className={style.barStats}>
                              <span className={style.barCount}>{count}</span>
                              <span className={style.barPercentage}>
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        </Popover>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          ) : props.forms && props.forms.length > 0 ? (
            <>
              {titlesToUse.map((value, index) => {
                const count = counts[value.title] || 0;

                return (
                  <li
                    key={index}
                    className={`${style.scoreBreakdownItem} ${
                      count > 0 ? style.active : ""
                    }`}
                    style={{
                      borderLeftColor: count > 0 ? value.color : "#e2e8f0",
                    }}
                  >
                    <span
                      style={{ backgroundColor: value.color }}
                      className={style.scoreDot}
                    ></span>
                    <span className={style.scoreBreakdownLabel}>
                      {value.title}
                    </span>
                    <span className={style.scoreBreakdownCount}>{count}</span>
                  </li>
                );
              })}
            </>
          ) : (
            <div className={style.noFeedbacks}>
              <FileTextOutlined className={style.noFeedbacksIcon} />
              <span className={style.noFeedbacksText}>אין משובים כרגע</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreChartUserForms;
