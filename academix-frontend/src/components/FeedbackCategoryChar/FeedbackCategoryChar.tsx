import { Tag, Tooltip as AntTooltip } from "antd";
import React, { useEffect, useState } from "react";
import style from "./FeedbackCategoryChar.module.css";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { feedbackType, formType } from "../../types/types";
import {
  InfoCircleFilled,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import stringCheckAndToolTip from "../../utils/stringCheck";
import { COLORS } from "../../services/ApiServices";

const colors = [
  "#940000",
  "#FE3502",
  "#FF7001",
  "#FAA201",
  "#FEFC00",
  "#C2BD6A",
  "#CDEBA3",
  "#AEDB00",
  "#02ABC4",
  "#00CC87",
  "#009791",
  "#009B00",
  "#015500",
  "#142A79",
  "#004AA3",
  "#0077F9",
  "#2EBBF9",
  "#A2D5ED",
  "#8900C7",
  "#9255AB",
  "#B8ABEF",
  "#380059",
  "#630095",
  "#FD9CB3",
];

interface FeedabackProps {
  feedbacks: feedbackType[];
}

const FeedbackCategoryChar = (props: FeedabackProps) => {
  const [isImproveActive, setIsImproveActive] = useState<boolean>(true);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [tagData, setTagData] = useState<any[]>([]);
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState<number>(0);
  const currentFeedback = props?.feedbacks[currentFeedbackIndex];

  useEffect(() => {
    if (
      props.feedbacks &&
      props.feedbacks.length > 0 &&
      currentFeedbackIndex < props.feedbacks.length
    ) {
      const currentFeedback = props.feedbacks[currentFeedbackIndex];
      if (
        currentFeedback &&
        currentFeedback.categories &&
        currentFeedback.categories.length > 0
      ) {
        const categoryTotals: Record<string, number> = {};
        currentFeedback.categories.forEach((category) => {
          const categoryName = category.categoryName;
          const countValue = isImproveActive
            ? category.counts?.improvement || 0
            : category.counts?.preservation || 0;
          categoryTotals[categoryName] = countValue;
        });
        const allCategories = Object.entries(categoryTotals).map(
          ([name, value]) => ({
            name,
            value,
            color:
              COLORS[Object.keys(categoryTotals).indexOf(name)] || COLORS[0],
          })
        );
        const filteredPieData = allCategories.filter((item) => item.value > 0);
        setPieChartData(filteredPieData);
        setTagData(allCategories);
      } else {
        setPieChartData([]);
        setTagData([]);
      }
    } else {
      setPieChartData([]);
      setTagData([]);
    }
  }, [isImproveActive, currentFeedbackIndex, props.feedbacks]);
 
  const goToNextFeedback = () => {
    if (props.feedbacks && props.feedbacks.length > 0) {
      setCurrentFeedbackIndex((prev) =>
        prev >= props.feedbacks.length - 1 ? 0 : prev + 1
      );
    }
  };
  const goToPrevFeedback = () => {
    if (props.feedbacks && props.feedbacks.length > 0) {
      setCurrentFeedbackIndex((prev) =>
        prev <= 0 ? props.feedbacks.length - 1 : prev - 1
      );
    }
  };
  return (
    <div className={style["container"]}>
      <div className={style["feedbackTabs"]}>
        {props.feedbacks.map((feedback, index) => {
          const isActive = currentFeedback?.feedbackId === feedback.feedbackId;
          return (
            <div
              key={feedback.feedbackId}
              className={style["feedbackTab"]}
              onClick={() => setCurrentFeedbackIndex(index)}
              style={{
                backgroundColor: isActive ? '#e6f7ff' : 'transparent',
                border: isActive ? '1px solid #1890ff' : '1px solid #d9d9d9',
                color: isActive ? '#1890ff' : '#6e7072',
              }}
            >
              <span>{stringCheckAndToolTip(feedback.feedbackName?.trim(), 30)}</span>
            </div>
          );
        })}
      </div>
      <div className={style["headerDiv"]}>
        {props.feedbacks.length > 1 && (
          <RightOutlined onClick={goToPrevFeedback} />
        )}
        <div>
          {!currentFeedback ? (
            " אין משובים"
          ) : (
            <h3 style={{ color: "#6E7072", fontSize: "20px", margin: "0" }}>
              {stringCheckAndToolTip(currentFeedback?.feedbackName?.trim(), 19)}
              {" - התפלגות תיוגים ל"}
              {isImproveActive ? "שיפור" : "שימור"}
              <AntTooltip title={"התיוגים נסכמו מכל המשובים"}>
                <InfoCircleOutlined
                  style={{
                    paddingRight: "5px",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                />
              </AntTooltip>
            </h3>
          )}
        </div>
        <div>
          <div className={style["imporveDiv"]}>
            <div
              onClick={() => {
                setIsImproveActive(!isImproveActive);
              }}
              className={style["imporveText"]}
              style={{
                backgroundColor: isImproveActive ? "white" : "",
              }}
            >
              שיפור
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "red",
                  marginRight: "10px",
                  borderRadius: "50%",
                }}
              ></div>
            </div>
            <div
              onClick={() => {
                setIsImproveActive(!isImproveActive);
              }}
              className={style["imporveText"]}
              style={{ backgroundColor: !isImproveActive ? "white" : "" }}
            >
              שימור
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "green",
                  marginRight: "10px",
                  borderRadius: "50%",
                }}
              ></div>
            </div>
          </div>
        </div>
        {props.feedbacks.length > 1 && (
          <LeftOutlined onClick={goToNextFeedback} />
        )}
      </div>

      <div className={style["bodyConatiner"]}>
        <div className={style["tagsContainer"]}>
          {currentFeedback?.categories?.map((category, index) => {
            const tagItem = tagData.find(
              (item) => item.name === category.categoryName
            );
            const color = tagItem ? tagItem.color : colors[0];
            return (
              <Tag
                className={style["tagStyle"]}
                key={`${currentFeedback.feedbackId}-${index}`}
                style={{
                  whiteSpace: "nowrap",
                  border: "1px solid #d9d9d9",
                  backgroundColor:"white",
                }}
              >
                <span
                  className={style["tagDot"]}
                  style={{
                    backgroundColor: color,
                  }}
                />
                <span className={style["tagNumber"]}>
                  {isImproveActive
                    ? category.counts?.improvement !== undefined
                      ? category.counts.improvement
                      : 0
                    : category.counts?.preservation !== undefined
                    ? category.counts.preservation
                    : 0}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#6e7072",
                    fontWeight: "bold",
                  }}
                >
                  {category?.categoryName}
                </span>
              </Tag>
            );
          })}
        </div>

        <div className={style["pieContainer"]}>
          <PieChart width={220} height={220}>
            <Pie
              style={{ outline: "none" }}
              data={pieChartData}
              outerRadius={88}
              innerRadius={62}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              {pieChartData.map((item, index) => (
                <Cell
                  key={index}
                  fill={item.color}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                <div key="tooltip" style={{ padding: "5px" }}>
                  <div
                    style={{ fontWeight: "bold", color: props.payload.fill }}
                  >
                    {value} {name}
                  </div>
                </div>,
              ]}
              contentStyle={{
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                borderRadius: "8px",
                padding: "8px",
                backgroundColor: "white",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCategoryChar;