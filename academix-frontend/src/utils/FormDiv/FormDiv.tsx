import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  CopyOutlined,
  FileTextOutlined,
  MoreOutlined,
  StarFilled,
  StopOutlined,
  TagOutlined,
  UserOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { format, formatDate } from "date-fns";
import { getScoreColor } from "../ScoreUlLi";
import style from "./FormDiv.module.css";
import { useNavigate } from "react-router-dom";
import { useSelectionsStore } from "../../store/selectionStore";
import stringCheckAndToolTip from "../stringCheck";
import { Dropdown, Menu, message, notification, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { usePermissionStore } from "../../store/permissionStore";
import { Form, Permission, Team } from "../../types/types";
import Notification from "../../UI/Notification/Notification";
import { he } from "date-fns/locale";
import {
  toggleFormActive,
  toggleFormDuplicate,
} from "../../services/ApiServices";
import { queryClient } from "../../api/queryClient";
import { useEffect, useMemo, useRef, useState } from "react";

const FormDiv = ({
  form,
  byUser,
  taskId,
  teamId,
  teamName,
  users_count,
  register,
  traineeNames,
}: {
  form: any;
  byUser: boolean;
  status?: string;
  taskId?: number;
  teamId?: number;
  teamName?: string;
  users_count?: number;
  register?: boolean;
  traineeNames?: string[];
}) => {
  const navigate = useNavigate();
  const { selectedTeam } = useSelectionsStore();
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );

  useEffect(() => {
    if (textRef.current) {
      const isTextOverflow =
        textRef.current.scrollWidth > textRef.current.clientWidth;
      setIsOverflow(isTextOverflow);
    }
  }, [form.formTitle]);

  const handleToggleFormActive = async (formId: number | string) => {
    try {
      const result = await toggleFormActive(formId);
      if (result.success) {
        message.success(result.message);
        await queryClient.invalidateQueries({
          queryKey: ["courseIdForForms"],
        });
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error("Error toggling form active:", error);
      message.error("אירעה שגיאה");
    }
  };
  const handleToggleFormDuplicate = async (formId: number | string) => {
    try {
      const result = await toggleFormDuplicate(formId);

      if (result.success) {
        message.success(result.message);

        await queryClient.invalidateQueries({
          queryKey: ["courseIdForForms"], // כל הווריאציות
        });

        // refetchForms();  // ✅ רפרוש
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error("Error toggling form active:", error);
      message.error("אירעה שגיאה");
    }
  };
  // ===== פונקציה ליצירת menu items =====
  const getFormMenuItems = (): MenuProps["items"] => [
    {
      key: "toggle",
      label: form?.is_active ? "הגדר תבנית כלא פעילה" : "הגדר תבנית כפעילה",
      icon: <DeleteOutlined />,
      onClick: () => handleToggleFormActive(form.id),
      danger: true,
    },
  ];

  const handleTitleClick = () => {
    if ((taskId && selectedTeam?.id) || (taskId && teamId)) {
      const finalId = !selectedTeam ? teamId : selectedTeam?.id;
    } else if (taskId && !selectedTeam?.id) {
      alert("can grade a form only from team or user dashboard");
    } else if (register) {
      navigate(`/forms/edit/${form?.id}`);
    }
  };

  const menu = (
    <Menu>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={() => handleToggleFormActive(form.id)}
      >
        {form?.is_active ? (
          <span>הגדר תבנית כלא פעילה</span>
        ) : (
          <span>הגדר תבנית כפעילה</span>
        )}
      </Menu.Item>
      <Menu.Item
        key="duplicate"
        icon={<CopyOutlined />}
        onClick={() => handleToggleFormDuplicate(form.id)}
      >
        <span>שכפול מבחן</span>
      </Menu.Item>
    </Menu>
  );

  const adjustColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  const getFormNavigationPath = (
    form: any,
    selectedTeam: any,
    selectedPermission: any
  ): any => {
    const isCompleted = form.completed_at !== null;
    const hasScore = form.scorePercentage !== null;
    const isStudent = selectedPermission.role_code === "STUDENT";

    // מקרה 1: טופס לא הושלם - לענות
    if (!isCompleted && isStudent) {
      return `/forms/answer/${form.taskassignmentid}`;
    }
    // מקרה 2: מישהו שהוא לא סטודנט (מפ"צ,חופף,וכו...) מנסה להכנס לטופס שלא הושלם - אין אפשרות
    if (!isCompleted && !isStudent) {
      return Notification({
        type: "error",
        msg: "רק חניך יכול לענות על המבחן!",
      });
    }
    // מקרה 3: הושלם אבל אין ציון - לדרג (רק לא סטודנטים)
    if (isCompleted && !hasScore && !isStudent) {
      return `/forms/grading?taskId=${form.taskId}&teamId=${selectedTeam.id}`;
    }
    if (isCompleted && !hasScore && isStudent) {
      return Notification({
        type: "error",
        msg: "המבחן בבדיקה!",
      });
    }

    // מקרה 4: הושלם ויש ציון - להציג
    return `/forms/show/${form.taskassignmentid}`;
  };
  const canEdit =
    selectedPermission?.role_code === "COURSE_COMMANDER" ||
    selectedPermission?.role_code === "SYSTEM-ADMIN" ||
    ((selectedPermission?.role_code === "TEAM_COMMANDER" ||
      selectedPermission?.role_code === "OVERLAP") &&
      form.formTeamId === selectedTeam?.id);
  return (
    <div
      className={style["conatinersv"]}
      style={{
        cursor: "pointer",
      }}
    >
      {byUser ? (
        <div
          className={style["divWarp"]}
          onClick={() =>
            navigate(
              getFormNavigationPath(form, selectedTeam, selectedPermission)
            )
          }
        >
          <div className={style.divHeader}>
            {/* שמאל: תאריך וכותרת */}
            <div className={style.leftSection}>
              <span className={style.assignAt}>
                <CalendarOutlined className={style.icon} />
                {formatDate(
                  new Date(form.assignAt),
                  "EEEE, d בMMMM yyyy, HH:mm",
                  { locale: he }
                )}
              </span>

              {isOverflow ? (
                <Tooltip title={form.formTitle} placement="top">
                  <span className={style.formTitle} ref={textRef}>
                    {form.formTitle}
                  </span>
                </Tooltip>
              ) : (
                <span className={style.formTitle} ref={textRef}>
                  {form.formTitle}
                </span>
              )}

              <span className={style.taskName}>{form.taskName}</span>
            </div>

            {/* ימין: ציון */}
            <div
              className={style.scoreBadge}
              style={{
                background:
                  form.scorePercentage === null
                    ? "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
                    : `linear-gradient(135deg, ${getScoreColor(
                        form.scorePercentage
                      )} 0%, ${adjustColor(
                        getScoreColor(form.scorePercentage),
                        -15
                      )} 100%)`,
                boxShadow:
                  form.scorePercentage !== null
                    ? `0 4px 14px ${getScoreColor(form.scorePercentage)}40`
                    : "none",
              }}
            >
              {form.scorePercentage === null ? (
                <>
                  {form.completed_at ? (
                    <>
                      <ClockCircleOutlined className={style.badgeIcon} />
                      <span className={style.badgeText}>ממתין לציון</span>
                    </>
                  ) : (
                    <>
                      <EditOutlined className={style.badgeIcon} />
                      <span className={style.badgeText}>לא בוצע</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className={style.scoreNumber}>
                    {Math.floor(form.score)}
                  </span>
                  <span className={style.scoreLabel}>ציון</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={style["cardContainer"]} onClick={handleTitleClick}>
          <div
            className={style["mainRow"]}
            onClick={(e) => {
              if (!register) navigate("/forms/detailes", { state: form });
            }}
          >
            {/* Title */}
            <div className={style["titleSection"]}>
              <FileTextOutlined className={style["titleIcon"]} />
              <span className={style["formTitle"]}>
                {taskId
                  ? stringCheckAndToolTip(form?.title, 15)
                  : stringCheckAndToolTip(form?.title, 25)}
              </span>
              {!form?.is_active && (
                <Tooltip title="לא יהיה ניתן להשתמש במשוב זה  במשימות חדשות">
                  <span className={style["inactiveBadge"]}>
                    <StopOutlined />
                    לא פעיל
                  </span>
                </Tooltip>
              )}
            </div>
            {/* Right Side Actions */}
            <div className={style["actionsRow"]}>
              {/* Average Score Badge */}
              {taskId && (
                <div className={style["avgBadge"]}>
                  <StarFilled className={style["avgIcon"]} />
                  <span>ממוצע {form?.scores_average?.toFixed(0) || 0}</span>
                </div>
              )}
              {canEdit && (
                // ===== שינוי: overlay → menu =====
                <Dropdown
                  menu={{
                    items: getFormMenuItems(),
                    onClick: (e) => {
                      e.domEvent.stopPropagation();
                    },
                  }}
                  trigger={["click"]}
                >
                  <span
                    className={style["menuBtn"]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreOutlined />
                  </span>
                </Dropdown>
              )}
            </div>
          </div>
          <div className={style["infoRow"]}>
            {taskId && (
              <>
                <Tooltip
                  title={
                    traineeNames && traineeNames.length > 0 ? (
                      <div style={{ direction: "rtl", lineHeight: "1.6" }}>
                        {traineeNames.map((name: string, index: number) => (
                          <div key={index}>{name}</div>
                        ))}
                      </div>
                    ) : (
                      "אין נבחנים"
                    )
                  }
                >
                  <div className={style["infoItem"]}>
                    <UserOutlined className={style["infoIcon"]} />
                    <span>{users_count || 0} נבחנים</span>
                  </div>
                </Tooltip>
                <div className={style["infoDivider"]} />
                <div className={style["infoItem"]}>
                  <CalendarOutlined className={style["infoIcon"]} />
                  <span>
                    {form?.assignmentAt
                      ? format(new Date(form.assignmentAt), "dd.MM.yy")
                      : ""}
                  </span>
                </div>
              </>
            )}
          </div>
          {!register && form?.taskName && (
            <div className={style["taskNameRow"]}>
              <TagOutlined className={style["taskIcon"]} />
              <span className={style["taskName"]}>{form.taskName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormDiv;
