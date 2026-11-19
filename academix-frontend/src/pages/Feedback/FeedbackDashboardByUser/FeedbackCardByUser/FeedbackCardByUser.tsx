import { feedbackType } from "../../../../types/types";
import { formatDate } from "../../../../utils/formatDate";
import { Progress, Tooltip } from "antd";
import stringCheckAndToolTip from "../../../../utils/stringCheck";
import style from "./FeedbackCardByUser.module.css";
import { useNavigate } from "react-router-dom";
import { usePermissionStore } from "../../../../store/permissionStore";
import { useRef, useEffect, useState, useMemo } from "react";
import { useSelectionsStore } from "../../../../store/selectionStore";
import { updateFeedbackIsViewable } from "../../../../services/ApiServices";
import TaskUserTag from "../../../../components/Task/TaskTag/TaskUserTag";

interface FeedbackCardByUserProps {
  feedback: feedbackType;
}

const FeedbackCardByUser = ({ feedback }: FeedbackCardByUserProps) => {
  const navigate = useNavigate();
  const { selectedPermission } = usePermissionStore();
  const tagsRef = useRef<HTMLDivElement>(null);
  const { selectedTeam, selectedTeamMember } = useSelectionsStore();
  const [isEnableView, setIsEnableView] = useState<boolean>(
    feedback?.answers[0]?.feedbackAnswerIsViewable ?? true
  );
  const isStudent = selectedPermission?.role_code === "STUDENT";
  const hasNoAnswers = !feedback.answers || feedback.answers.length === 0;
  const isWaitingForCheck = isStudent && hasNoAnswers;

  const taskForTag = useMemo(() => {
    return {
      id: feedback.taskAssignmentId || 0,
      name: feedback.taskName || feedback.feedbackName,
      taskName: feedback.taskName,
      taskAssignmentId: feedback.taskAssignmentId || 0,
      completed: feedback.taskCompleted
        ? new Date(feedback.taskCompleted)
        : null,
      completed_at: feedback.taskCompleted_at
        ? new Date(feedback.taskCompleted_at)
        : null,
      assigned: feedback.formStartDate
        ? new Date(feedback.formStartDate)
        : null,
      notRequiredToSubmit: false,
    };
  }, [feedback]);

  const getCategoryColor = (category: any) => {
    if (category.counts?.preservation && category.counts.preservation > 0) {
      return "rgba(163, 243, 196, 1)";
    } else if (
      category.counts?.improvement &&
      category.counts.improvement > 0
    ) {
      return "rgb(255, 120, 104)";
    }
    return "#EAEAEA";
  };

  const getGradeInfo = (grade: number) => {
    switch (true) {
      case grade === 0:
        return { color: "#6e7072", title: "לא הוגש" };
      case grade >= 1 && grade <= 10:
        return { color: "#FC523E", title: "לא מספיק" };
      case grade >= 11 && grade <= 20:
        return { color: "#FF7868", title: "גרוע" };
      case grade >= 21 && grade <= 30:
        return { color: "#FF9B8F", title: "חלש" };
      case grade >= 31 && grade <= 40:
        return { color: "#ECBFAD", title: "בינוני נמוך" };
      case grade >= 41 && grade <= 50:
        return { color: "#FFA52D", title: "בינוני" };
      case grade >= 51 && grade <= 60:
        return { color: "#FFD12D", title: "בינוני גבוה" };
      case grade >= 61 && grade <= 70:
        return { color: "#71DBC0", title: "טוב" };
      case grade >= 71 && grade <= 80:
        return { color: "#58B49C", title: "טוב מאוד" };
      case grade >= 81 && grade <= 90:
        return { color: "#329C80", title: "מעולה" };
      case grade >= 91 && grade <= 100:
        return { color: "#1E7F66", title: "מצויין" };
      default:
        return { color: "#6e7072", title: "לא הוגש" };
    }
  };

  const getTextWithTooltip = (
    text: string,
    maxLength: number,
    fontSize?: string
  ) => {
    if (!text || text.length <= maxLength) {
      return <span style={{ fontSize }}>{text}</span>;
    }
    return (
      <Tooltip title={text}>
        <span style={{ fontSize }}>
          {stringCheckAndToolTip(text, maxLength)}
        </span>
      </Tooltip>
    );
  };

  const handleNavigate = () => {
    if (hasNoAnswers && !isStudent && feedback.taskId && selectedTeam.id) {
      const queryParams = new URLSearchParams({
        dates: feedback.formStartDate || "",
        assignmentIds: feedback.taskAssignmentId?.toString() || "",
      });

      navigate(
        `/feedback/${feedback.taskId}/fill/${
          selectedTeam.id
        }?${queryParams.toString()}`
      );
    } else if (isStudent) {
      navigate(`/feedback/${feedback?.taskAssignmentId}/view`, {
        state: feedback.reviewerName,
      });
    } else {
      const queryParams = new URLSearchParams({
        dates: feedback.formStartDate || "",
        assignmentIds: feedback.taskAssignmentId?.toString() || "",
      });
      navigate(
        `/feedback/${feedback.taskId}/fill/${
          selectedTeam.id
        }?${queryParams.toString()}`
      );
    }
  };
  const { color, title } = getGradeInfo(
    feedback?.answers[0]?.summary_grade ?? 0
  );

  return (
    <div
    // לסדר פה את CSS לCLASS !!!!!
      className={style["card"]}
      onClick={isWaitingForCheck ? undefined : handleNavigate}
      style={{
        cursor: isWaitingForCheck ? "default" : "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isWaitingForCheck && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(0.5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#1890ff",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "8px 16px",
              borderRadius: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            מחכה לבדיקה
          </span>
        </div>
      )}

      <div className={style["header"]}>
        <div
          className={style["title"]}
          style={{ fontWeight: "bold", fontSize: "18px" }}
        >
          {getTextWithTooltip(feedback.feedbackName.trim(), 25)}
          <br />
          <span style={{ fontSize: "12px" }}>
            שיוך למשימה :{" "}
            {getTextWithTooltip(feedback.taskName ?? "", 20, "12px")}
          </span>
          <span
            style={{ fontSize: "12px", display: "flex", alignItems: "center" }}
          >
            מושב על ידי {feedback.reviewerName}
          </span>
        </div>

        <div
          className={style["bellWarp"]}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
            marginRight: "16px",
          }}
        >
          <div style={{ fontSize: "12px" }}>

            {

              // צריך להחליט מה עושים עם התאריך פה
            /* <Tooltip title={ <>
                שובץ ב {formatDate(
                  feedback?.taskAssignmentsStart ?? ''
                ) }
                <br />
              מושב ב {formatDate(feedback?.formStartDate)}
                </>
              }>
              <InfoCircleOutlined style={{fontSize:"large"}}/>
              </Tooltip> */}
            {feedback?.formStartDate === null
              ? "משוב מתוך תור"
              : (formatDate(feedback?.formStartDate) ||
                formatDate(feedback.feedbackCreatedAt))}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <TaskUserTag task={taskForTag} />
          </div>
        </div>
      </div>

      <div className={style["tags-container"]}>
        <div ref={tagsRef} className={style["tags"]}>
          {feedback.categories.length > 0
            ? feedback?.categories
                .slice(0, 3)
                ?.filter(
                  (item) =>
                    (item.counts?.improvement ?? 0) !== 0 ||
                    (item.counts?.preservation ?? 0) !== 0
                )
                .map((item, index) => (
                  <span
                    key={index}
                    className={style["tag"]}
                    style={{ backgroundColor: getCategoryColor(item) }}
                  >
                    {stringCheckAndToolTip(item?.categoryName.trim(), 65)}
                  </span>
                ))
            : "אין תגים🕵️‍♂️"}
        </div>
        <span>{feedback?.categories.length > 3 && "..."}</span>
      </div>
      {feedback.answers.length > 0 &&
        selectedPermission?.role_code !== "STUDENT" && (
          <Tooltip
            placement="top"
            title={"קבע/י האם המשוב יהיה זמין לצפייה עבור החניך"}
          >
            <div className={style["imporveDiv"]}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEnableView(!isEnableView);
                  updateFeedbackIsViewable(
                    feedback.feedbackId,
                    feedback.taskAssignmentId,
                    selectedTeamMember.id,
                    !isEnableView
                  );
                }}
                className={style["imporveText"]}
                style={{
                  backgroundColor: isEnableView ? "#d4c7ad" : "",
                }}
              >
                פתוח לצפייה
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEnableView(!isEnableView);
                  updateFeedbackIsViewable(
                    feedback.feedbackId,
                    feedback.taskAssignmentId,
                    selectedTeamMember.id,
                    !isEnableView
                  );
                }}
                className={style["imporveText"]}
                style={{ backgroundColor: !isEnableView ? "#d4c7ad" : "" }}
              >
                חסום לצפייה
              </div>
            </div>
          </Tooltip>
        )}

      <div style={{ fontSize: "14px", fontWeight: "bold", marginTop: "8px" }}>
        {(feedback.seenGrade ||
          selectedPermission?.role_code !== "STUDENT") && (
          <>
            <Progress
              strokeColor={color}
              showInfo={false}
              percent={feedback?.answers[0]?.summary_grade}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "4px",
              }}
            >
              <span>
                {"ציון  : " +
                  (feedback?.answers[0]?.summary_grade ?? "ממתין...")}
              </span>
              <span>{title}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackCardByUser;
