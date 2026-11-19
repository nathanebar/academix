import {
  MoreOutlined,
  DeleteOutlined,
  StopOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, message, Tooltip } from "antd";
import type { MenuProps } from "antd";
import style from "./TempleteFeedback.module.css";
import { formatDate } from "../../../../utils/formatDate";
import { useNavigate } from "react-router-dom";
import stringCheckAndToolTip from "../../../../utils/stringCheck";
import { useSelectionsStore } from "../../../../store/selectionStore";
import { Assignment, feedbackType, ROLE_CODE } from "../../../../types/types";
import { useUserStore } from "../../../../store/userStore";
import { usePermissionStore } from "../../../../store/permissionStore";
import { AreaChart } from "recharts";
import { toggleFeedbackActive } from "../../../../services/ApiServices";
import { queryClient } from "../../../../api/queryClient";

interface templateFeedbackProps {
  allFeedbackInfo?: feedbackType;
  taskId?: number;
  feedbackTitle: string;
  category?: string[];
  taskName?: string;
  taskDate?: { start: string; id: number }[];
  assignmentsCount?: number;
  answersCount?: number;
}
interface AssignmentDateButtonProps {
  assignments: {
    start: string;
    end: string;
    count?: number;
  }[];
}
const TempleteFeedback = (props: templateFeedbackProps) => {
  const { selectedTeam, selectedCourse } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();
  const navigate = useNavigate();
  const isInactive = !props?.allFeedbackInfo?.is_active && !props?.taskId;
  const canShowDropdown =
    selectedPermission?.role_code === "DOMAIN_MANAGER" ||
    selectedPermission?.role_code === "SYSTEM-ADMIN" ||
    selectedPermission?.role_code === "COURSE_COMMANDER";

  const canEdit =
    selectedPermission?.role_code === "COURSE_COMMANDER" ||
    selectedPermission?.role_code === "SYSTEM-ADMIN" ||
    ((selectedPermission?.role_code === "TEAM_COMMANDER" ||
      selectedPermission?.role_code === "OVERLAP") &&
      props.allFeedbackInfo?.teamId === selectedTeam.id);

  const handleToggleFeedbackActive = async (feedbackId: number | string) => {
    try {
      const result = await toggleFeedbackActive(feedbackId);
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: [
            "feedbackcourseId",
            selectedCourse?.id,
            "feedbackteamId",
            selectedTeam?.id,
          ],
        });
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error("Error toggling feedback active:", error);
      message.error("אירעה שגיאה");
    }
  };

  // ===== פונקציה ליצירת menu items =====
  const getFeedbackMenuItems = (): MenuProps["items"] => [
    {
      key: "toggle",
      label: props?.allFeedbackInfo?.is_active
        ? "הגדר תבנית כלא פעילה"
        : "הגדר תבנית כפעילה",
      onClick: () => {
        handleToggleFeedbackActive(Number(props.allFeedbackInfo?.feedbackId));
      },
    },
  ];
  const handleClick = () => {
    if (isInactive) return;

    const { taskDate, taskId, allFeedbackInfo } = props;
    const feedbackId = allFeedbackInfo?.feedbackId;
    const teamId = allFeedbackInfo?.teamId;
    const permission: ROLE_CODE | undefined = selectedPermission?.role_code;

    if (!taskDate) {
      if (!feedbackId) {
        console.warn("Missing feedbackId – cannot navigate");
        return;
      }
      if (allFeedbackInfo?.answers[0]?.summary_grade !== undefined) {
        navigate(`/feedback/view/${feedbackId}`);
      } else {
        if (permission === "TEAM_COMMANDER") {
          if (teamId !== null) {
            navigate(`/feedback/edit/${feedbackId}`);
          } else {
            navigate(`/feedback/view/${feedbackId}`);
          }
        } else {
          navigate(`/feedback/edit/${feedbackId}`);
        }
        return;
      }
    }

    const dates =
      (props.taskDate as { start: string }[])?.map((d) => d.start) || [];
    const assignmentIds = props.taskDate?.map((d) => d.id) || [];

    if (taskId && selectedTeam?.id) {
      const queryParams = new URLSearchParams({
        dates: dates?.join(",") || "",
        assignmentIds: assignmentIds.join(","),
      });

      navigate(
        `/feedback/${taskId}/fill/${selectedTeam.id}?${queryParams.toString()}`
      );
    } else {
      console.warn(
        "Missing taskId or selectedTeam.id – cannot navigate to fill"
      );
    }
  };

  const AssignmentDateButton: React.FC<any> = ({ assignments }) => {
    // התאריך הראשון
    const firstAssignment = assignments[0];

    // כל התאריכים לטולטיפ
    const tooltipContent = assignments.map((a: any, index: number) => (
      <div key={index} style={{ marginBottom: "4px" }}>
        {a.count && a.count > 1 && (
          <span style={{ color: "#1890ff", marginLeft: "4px" }}>
            (×{a.count})
          </span>
        )}
        {formatDate(a.start)} - {formatDate(a.end)}
      </div>
    ));

    return (
      <Tooltip
        title={tooltipContent}
        placement="top"
        overlayStyle={{ maxWidth: "300px" }}
      >
        <Button
          type="text"
          size="small"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            height: "auto",
          }}
        >
          <CalendarOutlined style={{ color: "#1890ff" }} />
          <span style={{ fontSize: "14px", color: "#4d4d4d" }}>
            {firstAssignment.start
              ? formatDate(firstAssignment.start)
              : "מהתור משימות "}
          </span>
          {assignments.length > 1 && (
            <span
              style={{
                fontSize: "11px",
                color: "#fff",
                backgroundColor: "#1890ff",
                padding: "0 6px",
                borderRadius: "10px",
              }}
            >
              +{assignments.length - 1}
            </span>
          )}
        </Button>
      </Tooltip>
    );
  };

  return (
    <div
      className={`${style["feedbackBox"]} ${
        isInactive ? style["inactive"] : ""
      }`}
      onClick={isInactive ? undefined : handleClick}
    >
      <div style={!props.category ? { maxWidth: "70%" } : { maxWidth: "100%" }}>
        {isInactive && (
          <div className={style["inactiveOverlay"]}>
            <StopOutlined />
            <span>לא פעיל</span>
          </div>
        )}
        <div className={style["feedbackHeader"]}>
          <p className={style["feedbackTitle"]}>
            {stringCheckAndToolTip(
              props.taskName
                ? props.taskName?.trim()
                : props.feedbackTitle?.trim(),
              48
            )}
          </p>
          {canEdit && !props?.taskId && (
            <Dropdown
              menu={{
                items: getFeedbackMenuItems(),
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                },
              }}
              trigger={["click"]}
            >
              <span
                className={style["dropDownClass"]}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreOutlined />
              </span>
            </Dropdown>
          )}
        </div>
        {!props.category ? (
          <p style={{ margin: "0", padding: "0 4px", color: "#4d4d4d" }}>
            {stringCheckAndToolTip(props.feedbackTitle, 50)}
          </p>
        ) : null}
        <div className={style["categoryDivClass"]}>
          {props.category &&
            props.category?.map((cat, index) => (
              <div className={style["categoryClass"]} key={index}>
                <span>{stringCheckAndToolTip(cat.trim(), 19)}</span>
              </div>
            ))}
        </div>
      </div>
      {!props.category && props.taskDate ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
        >
          {props.taskDate &&
          props.taskDate.length > 0 &&
          props.taskDate[0]?.start ? (
            <span style={{ fontSize: "10px", color: "#4d4d4d" }}>
              <AssignmentDateButton assignments={props.taskDate} />
            </span>
          ) : (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                height: "auto",
                fontSize: 10,
              }}
            >
              משימה מהתור *
            </span>
          )}
          <span
            style={{
              backgroundColor:
                Number(props.answersCount) === Number(props.assignmentsCount)
                  ? "#49c6a3"
                  : props.answersCount == 0
                  ? "#FC523E"
                  : "#F49833",
              borderRadius: "20px",
              textAlign: "center",
              width: "90px",
              color: "white",
              fontSize: "12px",
            }}
          >
            {props.answersCount}/{props.assignmentsCount}
            {" משובים "}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default TempleteFeedback;
