// TaskAssignmentCard.tsx
import React, { useState } from "react";
import style from "../FeedbackForm/FeedbackForm.module.css";
import { Input, notification, Switch, Tabs, Tag, Tooltip } from "antd";
import {
  getRatingOptionByIndex,
  calculatePercentage,
  colors,
} from "../../../../utils/gradeOption";
import TextArea from "antd/lib/input/TextArea";
import {
  InfoCircleFilled,
  InfoCircleOutlined,
  LockOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import TabPane from "antd/es/tabs/TabPane";

interface TaskAssignmentProps {
  taskAssignment: any;
  categoryStatus: Record<
    number,
    Record<number, "improvement" | "preservation" | null>
  >;
  comments: Record<number, string>;
  finalScores: Record<number, number | null>;
  questionAnswers: Record<number, Record<number, string>>;
  onCategoryClick: (taskAssignmentId: number, categoryId: number) => void;
  onCommentChange: (taskAssignmentId: number, comment: string) => void;
  onFinalScoreChange: (taskAssignmentId: number, score: number | null) => void;
  onQuestionAnswerChange: (
    taskAssignmentId: number,
    questionIndex: number,
    answer: string
  ) => void;
  selectedOptionLabel: any;
  setSelectedOptionLabel: any;
  seenGrade: boolean;
  handleLedearsCommentChange: (
    taskAssignmentId: number,
    comment: string
  ) => void;
  leadersOnlyComment: Record<number, string>;
  feedbackAnswerIsViewable: boolean | undefined;
  handleChangeFeedbackIsViewable: () => void;
}

const TaskAssignmentCard: React.FC<TaskAssignmentProps> = ({
  taskAssignment,
  categoryStatus,
  comments,
  finalScores,
  questionAnswers,
  onCategoryClick,
  onCommentChange,
  onFinalScoreChange,
  onQuestionAnswerChange,
  selectedOptionLabel,
  setSelectedOptionLabel,
  seenGrade,
  handleLedearsCommentChange,
  leadersOnlyComment,
  feedbackAnswerIsViewable,
  handleChangeFeedbackIsViewable,
}) => {
  return (
    <div key={taskAssignment.taskAssignmentId} className={style.assignmentCard}>
      <h3 style={{ direction: "rtl" }}>
        מילוי משוב משימה {taskAssignment.feedbackName}
      </h3>
      <div style={{ padding: 10 }}>
        <span>{taskAssignment.categoryComment}</span>
      </div>
      <div className={style.categoriesSection}>
        {taskAssignment.categories.map((category: any) => {
          const status =
            categoryStatus[taskAssignment.taskAssignmentId]?.[category.id];
          const statusClass = status ? style[status] : "";
          const classNames = `${style.categorie} ${statusClass}`.trim();

          return (
            <div
              key={category.id}
              className={classNames}
              onClick={() =>
                onCategoryClick(taskAssignment.taskAssignmentId, category.id)
              }
            >
              <span>{category.name}</span>
            </div>
          );
        })}
      </div>
      {/*_comment container */}
      <div className={style.commentContainer}>
        <Tabs defaultActiveKey="regular" size="large">
          <TabPane
            key="regular"
            tab={
              <span>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                הערה לנחפף
              </span>
            }
          >
            <Tooltip title="הערה לנחפף" placement="left">
              <TextArea
                placeholder="כתוב הערה לנחפף"
                rows={3}
                style={{
                  color: "rgba(94, 99, 102, 1)",
                  background: "rgba(244, 241, 235, 1)",
                  resize: "none",
                }}
                value={comments[taskAssignment.taskAssignmentId] || ""}
                onChange={(e) =>
                  onCommentChange(
                    taskAssignment.taskAssignmentId,
                    e.target.value
                  )
                }
              />
            </Tooltip>
          </TabPane>

          <TabPane
            key="leaders"
            tab={
              <span>
                <LockOutlined style={{ color: "#faad14", marginRight: 4 }} />
                הערה למפקדים בלבד
              </span>
            }
          >
            <Tooltip title="הערה זו חשופה רק למפקדים " placement="right">
              <TextArea
                placeholder="כתוב הערה למפקדים בלבד"
                rows={3}
                style={{
                  color: "rgba(94, 99, 102, 1)",
                  background: "rgba(255, 250, 230, 1)",
                  resize: "none",
                }}
                value={
                  leadersOnlyComment[taskAssignment.taskAssignmentId] || ""
                }
                onChange={(e) =>
                  handleLedearsCommentChange(
                    taskAssignment.taskAssignmentId,
                    e.target.value
                  )
                }
              />
            </Tooltip>
          </TabPane>
        </Tabs>
      </div>
      {/*_final score */}
      <div className={style.finalScoreContainer}>
        <h4>
          ציון סופי
          <Tooltip
            title={seenGrade ? "הציון מוצג לנחפף" : "הציון לא מוצג לנחפף"}
          >
            <InfoCircleOutlined
              style={{ paddingRight: "5px", cursor: "pointer" }}
            />
          </Tooltip>
        </h4>

        <Tag color={seenGrade ? "green" : "volcano"} style={{ margin: 0 }}>
          {seenGrade ? "ציון גלוי לחניך" : "ציון מוסתר מהחניך"}
        </Tag>

        <div className={style.ratingOptionsContainer}>
          {taskAssignment.select_option_score !== 10 ? (
            <div className={style.ratingOptionsContainer}>
              {getRatingOptionByIndex(taskAssignment.select_option_score).map(
                (item, index) => {
                  const dotColor = colors[index];
                  const selectedScore =
                    finalScores[taskAssignment.taskAssignmentId];

                  const originalScore = calculatePercentage(
                    getRatingOptionByIndex(taskAssignment.select_option_score)
                      .length - index,
                    getRatingOptionByIndex(taskAssignment.select_option_score)
                      .length
                  );

                  const isSelected =
                    selectedScore !== null &&
                    Math.round(selectedScore) === Math.round(originalScore);

                  return (
                    <Tooltip
                      key={index}
                      title={`ציון: ${originalScore} `}
                      placement="top"
                    >
                      <div
                        className={`${style.ratingOptionItem} ${isSelected ? style.selectedOption : ""
                          }`}
                        onClick={() => {
                          onFinalScoreChange(
                            taskAssignment.taskAssignmentId,
                            originalScore
                          );
                          setSelectedOptionLabel(item);
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: dotColor,
                            marginLeft: "8px",
                            verticalAlign: "middle",
                          }}
                        ></span>
                        {item}
                      </div>
                    </Tooltip>
                  );
                }
              )}
            </div>
          ) : (
            <div>
              <Input
                style={{ width: 200 }}
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                placeholder="הזן ציון סופי"
                value={finalScores[taskAssignment.taskAssignmentId] ?? ""}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === ',' || e.key === '-') {
                    e.preventDefault();
                    return;
                  }
                }}
                onChange={(e) => {
                  let raw = e.target.value;

                  raw = raw.replace(/[.,]/g, '');

                  const num = raw ? parseInt(raw, 10) : null;

                  if (num !== null && (num < 0 || num > 100)) {
                    notification.error({
                      message: "הציון צריך להיות בין 0 ל‑ 100",
                      duration: 2,
                    });
                    return;
                  }

                  onFinalScoreChange(taskAssignment.taskAssignmentId, num);
                  setSelectedOptionLabel(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
      {/*_questions section */}
      {taskAssignment.questions.length > 0 && (
        <div className={style.questionsSection}>
          {taskAssignment.questions.map(
            (question: any, questionIndex: number) => {
              const answer =
                questionAnswers[taskAssignment.taskAssignmentId]?.[
                questionIndex
                ] || "";

              return (
                <div
                  key={questionIndex}
                  className={style.questionAnswerContainer}
                >
                  <h4>
                    <strong>שאלה {questionIndex + 1}:</strong>{" "}
                    {question?.question_text}
                  </h4>
                  <Input.TextArea
                    style={{
                      color: "rgba(94, 99, 102, 1)",
                      background: "rgba(244, 241, 235, 1)",
                    }}
                    placeholder={`כתוב תשובה`}
                    value={answer}
                    onChange={(e) =>
                      onQuestionAnswerChange(
                        taskAssignment.taskAssignmentId,
                        questionIndex,
                        e.target.value
                      )
                    }
                  />
                </div>
              );
            }
          )}
        </div>
      )}
      <div>
        <h4 style={{ margin: 0, padding: "10px" }}>
          הצגת המשוב לחניך{" "}
          <Tooltip
            title="קבע/י האם המשוב יהיה זמין לצפייה עבור החניך"
          >
            <InfoCircleOutlined style={{ cursor: "pointer" }} />
          </Tooltip>
        </h4>
        <div>
          <div>
            <div className={style["imporveDiv"]}>
              <div
                onClick={handleChangeFeedbackIsViewable}
                className={style["imporveText"]}
                style={{
                  backgroundColor: feedbackAnswerIsViewable ? "#d4c7ad" : "",
                }}
              >
                פתוח לצפייה
              </div>
              <div
                onClick={handleChangeFeedbackIsViewable}
                className={style["imporveText"]}
                style={{
                  backgroundColor: !feedbackAnswerIsViewable ? "#d4c7ad" : "",
                }}
              >
                חסום לצפייה
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAssignmentCard;
