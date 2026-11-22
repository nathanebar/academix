import {
  Button,
  ConfigProvider,
  Dropdown,
  Modal,
  Popconfirm,
  Tag,
  Tooltip,
  message,
  notification,
} from "antd";
import style from "./Task.module.css";
import {
  MoreOutlined,
  LockOutlined,
  TeamOutlined,
  EyeInvisibleOutlined,
  UnorderedListOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import TaskUserTag from "./TaskTag/TaskUserTag";
import TaskTeamTag from "./TaskTag/TaskTeamTag";
import { UserTaskModal } from "../LazyTaskModals";
import { useState } from "react";
import { useEffect } from "react";
import api from "../../api/axios";
import { ItemType } from "antd/es/menu/interface";
import { useSelectionsStore } from "../../store/selectionStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NewTaskModal } from "../LazyTaskModals";
import TeamTaskModal from "../Modals/TeamTaskModal/TeamTaskModal";
import { usePermissionStore } from "../../store/permissionStore";
import { useCalendarStore } from "../../store/calendarStore";
import {
  assignToTeam,
  assignToTeamNew,
  assignToUser,
  assignToUserNew,
  checkTaskAssignmentExists,
  checkUserTaskAssignmentExists,
  deleteTask,
  deleteTaskAssignmentByUserId,
  deleteTaskAssignmentTeam,
  deleteTaskAssignmentUser,
  duplicateTask,
  fetchTeamQueueTasks,
} from "../../services/ApiServices";
import Notification from "../../UI/Notification/Notification";
import { Gradient, schemaMap, SchemaName } from "../../types/types";
import stringCheckAndToolTip from "../../utils/stringCheck";
import { Text } from "recharts";
import TaskWithAssignments from "./TaskWithAssignments/TaskWithAssignments";
import { Menu } from "antd/lib";
import { showAssignmentModal } from "../layout/Sidebar/DayCalendar/AssignmentActionModal";

interface TaskProps {
  taskGroupName?: string | undefined;
  task: any;
  start: boolean;
  activeHeaderType: string | null;
  filterOption: string;
  setOpenModal: any;
  setSelectedTask?: any;
  fromGradeStage?: boolean;
  isdayCalendar?: boolean;
  taskTeamId?: number | null;
  isLocked?: boolean;
  canModify?: boolean;
  filteredTaskId?: string | null;
  onClearFilter?: () => void;
  taskGroupColor?: SchemaName | Gradient;
  onTasksChanged?: any;
}

const Task: React.FC<TaskProps> = ({
  task,
  activeHeaderType,
  start,
  taskGroupName,
  filterOption,
  setOpenModal,
  setSelectedTask,
  fromGradeStage,
  isdayCalendar,
  taskTeamId: propTaskTeamId,
  isLocked: propIsLocked,
  canModify: propCanModify,
  filteredTaskId,
  onClearFilter,
  onTasksChanged,
  taskGroupColor,
}) => {
  const [openUserModal, setOpenUserModal] = useState<boolean>(false);
  const [openTeamModal, setOpenTeamModal] = useState<boolean>(false);
  const [openTeamMissionModal, setOpenTeamMissionModal] =
    useState<boolean>(false);
  const location = useLocation();
  const currentUrl = location.pathname;
  const {
    selectedCourseBatch,
    selectedTeam,
    selectedTeamMember,
    activeHeaderType: actHeader,
    selectedDate,
  } = useSelectionsStore();

  const queryClient = useQueryClient();
  const { selectedPermission } = usePermissionStore();
  const { viewMode, setViewMode } = useCalendarStore();
  const isTeamCommander = selectedPermission?.role_code === "TEAM_COMMANDER";
  const isSystemAdmin = selectedPermission?.role_code === "SYSTEM-ADMIN";

  // קבל את teamId מהמשימה
  const taskTeamId = propTaskTeamId ?? task.team_id ?? task.taskId ?? null;

  // משימה שנוצרה בהיררכיה גבוהה - אין team_id
  const isCreatedByManager = taskTeamId === null;

  // משימה שנוצרה על ידי מפקד צוות - יש team_id
  const isCreatedByCurrentTeam = taskTeamId !== null;

  // נעילה: רק מפ"צ ננעל על משימות היררכיה גבוהה
  // מנהל (SYSTEM-ADMIN) לא ננעל
  const isLocked =
    propIsLocked ??
    (() => {
      // אם זה מנהל מערכת - לא נעול (יכול לערוך הכל)
      if (isSystemAdmin) return false;
      // אם זה מפ"צ - נעול רק על משימות של היררכיה גבוהה
      if (isTeamCommander) {
        return isCreatedByManager;
      }
      return false;
    })();

  //   const gradient =
  // typeof task?.color === "string"
  //   ? schemaMap[task.color]
  //   : { from: " white", to: "white" };

  const gradient = isLocked
    ? typeof taskGroupColor === "string"
      ? schemaMap[taskGroupColor] ?? { from: "white", to: "white" }
      : taskGroupColor ?? { from: "white", to: "white" }
    : typeof task?.color === "string"
    ? schemaMap[task.color] ?? { from: "white", to: "white" }
    : typeof taskGroupColor === "string"
    ? { from: taskGroupColor, to: taskGroupColor }
    : { from: "white", to: "white" };

  const styleProps: React.CSSProperties = {
    "--from": gradient?.from,
    "--to": gradient?.to,
  } as React.CSSProperties;
  const canModify = propCanModify ?? !isLocked;
  const isFiltered = filteredTaskId === task.id?.toString();

  useEffect(() => {
    const el = document.getElementById(task.id);
    if (
      activeHeaderType === "courseBatches" ||
      activeHeaderType === "course" ||
      activeHeaderType === "domain" ||
      (selectedPermission?.role_code === "STUDENT" &&
        filterOption == "operational")
    ) {
      el?.classList.remove("draggable-task");
    } else {
      el?.classList.add("draggable-task");
      queryClient.invalidateQueries({
        queryKey: ["tasks-range"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks-team-day-assign"],
      });
    }
  }, [task, activeHeaderType, viewMode]);

  const handleTaskToArchive = async (
    type: "assignment_bank" | "archives" | "operational"
  ) => {
    if (isLocked) {
      notification.warning({
        message: "לא ניתן להעביר משימה זו",
        description: "משימה זו נוצרה בהיררכיה גבוה ואין באפשרותך להעביר אותה",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    try {
      const response = await api.put(`/tasks/${task.id}`, {
        status: type,
        courseBatchId: selectedCourseBatch.id,
      });
      queryClient.invalidateQueries({
        queryKey: ["AxisBatch"],
      });
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const baseItems: Record<string, Omit<ItemType, "key">> = {
    archive: {
      label: "העברה לארכיון",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: (e: any) => {
        e?.domEvent?.stopPropagation();
        handleTaskToArchive("archives");
      },
    },
    operational: {
      label: "העברה למאגר משימות",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: (e: any) => {
        e?.domEvent?.stopPropagation();
        handleTaskToArchive("operational");
      },
    },
    bank: {
      label: "העברה לאופליין",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: (e: any) => {
        e?.domEvent?.stopPropagation();
        handleTaskToArchive("assignment_bank");
      },
    },
    delete: {
      label: (
        <Popconfirm
          title="האם אתה בטוח שברצונך למחוק את המשימה?"
          description="פעולה זו לא ניתנת לביטול"
          onConfirm={() => handleDelete(task.id)}
          okText="כן, מחק"
          cancelText="ביטול"
          placement="bottom"
        >
          <div style={{ color: "red" }}>מחיקה</div>
        </Popconfirm>
      ),
      style: { borderBottom: "1px solid #f0f0f0" },
      disabled: propIsLocked,
    },
    teamDashboard: {
      label: "דשבורד צוות",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: (e: any) => {
        e?.domEvent?.stopPropagation?.();
        setOpenTeamMissionModal(true);
      },
    },
    toQueue: {
      label: !task.has_queue_task ? "העברה לתור משימות" : "הסר מתור משימות",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: (e: any) => {
        e?.domEvent?.stopPropagation();

        queueMutation.mutate({
          taskId: task.id,
          isQueueTask: task.has_queue_task,
          taskAssignmentId: task.has_queue_task
            ? task.taskAssignmentId || task?.task_assignment_id
            : undefined,
        });

        // if (onAddToQueue) {
        //   onAddToQueue(task.id,/*  {
        //     id: task.id,
        //     name: task.name,
        //     color: task.color || taskGroupColor || "#1890ff",
        //   } */);
        // }
      },
    },
    duplicateTaskToQueuq: {
      label: !task.has_queue_task
        ? "יצירת מופע חדש למשימה בתור המשימות"
        : "הסרה",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: (e: any) => {
        e?.domEvent?.stopPropagation();

        queueMutation.mutate({
          taskId: task.id,
          isQueueTask: task.has_queue_task,
          taskAssignmentId: task.has_queue_task
            ? task.taskAssignmentId || task?.task_assignment_id
            : undefined,
        });

        // if (onAddToQueue) {
        //   onAddToQueue(task.id,/*  {
        //     id: task.id,
        //     name: task.name,
        //     color: task.color || taskGroupColor || "#1890ff",
        //   } */);
        // }
      },
    },
  };

  const itemMap: Record<string, string[]> = {
    archives: ["operational", "bank", "delete"],
    operational: [
      "archive",
      "bank",
      "delete",
      "teamDashboard",
      Number(task?.assignedcount) == 0 ? "toQueue" : "duplicateTaskToQueuq",
    ],
    assignment_bank: ["archive", "operational", "delete"],
  };

  const getItemsForFilter = (
    filterOption: keyof typeof itemMap,
    selectedTeamName: string | null,
    selectedTeamMemberName: string | undefined
  ): ItemType[] => {
    const rawKeys = itemMap[filterOption] ?? [];

    // מנהל מערכת יכול הכל
    // מפ"צ רואה רק דשבורד צוות למשימות של היררכיה גבוהה
    if (isCreatedByManager && isTeamCommander && !isSystemAdmin) {
      const dashboardItem = baseItems["teamDashboard"];
      if (dashboardItem && selectedTeamName && !selectedTeamMemberName) {
        return [{ key: "teamDashboard", ...dashboardItem }];
      }
      return [];
    }

    const allowedKeys = rawKeys.filter((key) => {
      if (isLocked) return false;
      if (key === "teamDashboard") {
        return !!selectedTeamName && !selectedTeamMemberName;
      }
      return true;
    });
    return allowedKeys.map((key) => ({
      key,
      ...baseItems[key],
    }));
  };

  const items: ItemType[] | undefined = getItemsForFilter(
    filterOption,
    selectedTeam?.name,
    selectedTeamMember?.name
  );

  const handleOpenTaskModal = (task: any) => {
    if (isTeamCommander && taskTeamId === null) {
      notification.warning({
        message: "לא ניתן לערוך משימה זו",
        description: "שים לב- המשימה נוצרה בהיררכיה גבוה ולכן אינך מורשה לערוך",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    if (isLocked) {
      notification.warning({
        message: "לא ניתן לערוך משימה זו",
        description: "שים לב- המשימה נוצרה בהיררכיה גבוה ולכן אינך מורשה לערוך",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }

    if (filteredTaskId) {
      onClearFilter?.();
      return;
    }

    if (selectedTeamMember) {
      if (task.assigned || task?.has_queue_task) {
        setOpenUserModal(true);
      }
    } else if (activeHeaderType === "team") {
      setOpenModal(true);
    } else {
      setOpenModal(true);
    }
    setSelectedTask(task);
  };

  const handleDelete = async (id: number) => {
    if (isLocked) {
      notification.warning({
        message: "לא ניתן למחוק משימה זו",
        description: "המשימה נוצרה בהיררכיה גבוה ",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    const result = await deleteTask(id);
    if (result.success) {
      Notification({ type: "success", msg: "המשימה נמחקה" });
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });
      onTasksChanged();
    } else {
      Notification({ type: "error", msg: result.message ?? "שגיאה במחיקה" });
    }
  };
  const queueMutation = useMutation({
    mutationFn: async ({
      taskId,
      isQueueTask,
      taskAssignmentId,
    }: {
      taskId: number;
      isQueueTask: boolean;
      taskAssignmentId?: number;
    }) => {
      // =============================================
      // הסרה מתור
      // =============================================
      if (isQueueTask) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: "הסרת משימה מהתור",
            content: (
              <div>
                <p>האם אתה בטוח שברצונך להסיר את המשימה מהתור?</p>
                <p style={{ fontWeight: 500, marginTop: 8 }}>
                  ⚠️ פעולה זו תסיר את המשימה מהתור
                  {activeHeaderType !== "teamMember" &&
                    " (וכל המופעים שלה בלוח השנה)"}
                  .
                </p>
              </div>
            ),
            okText: "כן, הסר",
            cancelText: "ביטול",
            okButtonProps: {
              danger: true,
            },
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (!confirmed) {
          return;
        }

        if (activeHeaderType !== "teamMember") {
          await deleteTaskAssignmentTeam(Number(taskId), selectedTeam.id);
          message.success("המשימה הוסרה מהתור");
        } else {
          await deleteTaskAssignmentUser(taskAssignmentId);
          message.success("המשימה הוסרה מהתור");
        }
        return;
      }

      // =============================================
      // הוספה לתור
      // =============================================
      const realDate = selectedDate?.format("DD/MM/YYYY");

      // =============================================
      // מצב: Team
      // =============================================
      if (activeHeaderType !== "teamMember") {
        const hasExisting = await checkTaskAssignmentExists(
          taskId,
          selectedTeam.id
        );

        if (hasExisting) {
          notification.info({
            message: "משימה כבר משובצת",
            description: "תיווצר משימה נוספת בתור",
            duration: 2,
            placement: "topRight",
          });
        }

        return await assignToTeamNew(
          taskId,
          selectedTeam.id,
          null, // start
          null, // end
          selectedCourseBatch?.id,
          realDate,
          true // isQueueTask
        );
      } else if (selectedTeamMember && selectedTeam) {
        const memberId = selectedTeamMember.id ?? -1;

        const hasExisting = await checkUserTaskAssignmentExists(
          taskId,
          selectedTeam.id,
          memberId
        );

        if (hasExisting) {
          notification.info({
            message: "משימה כבר משובצת",
            description: "תיווצר משימה נוספת בתור",
            duration: 2,
            placement: "topRight",
          });
        }

        return await assignToUserNew(
          taskId,
          selectedTeam.id,
          memberId,
          null, // start
          null, // end
          selectedCourseBatch?.id,
          true // isQueueTask
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["team-queue-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-users"] });
      queryClient.invalidateQueries({
        queryKey: ["assignments-completed-by-team"],
      });
      queryClient.invalidateQueries({ queryKey: ["tasks-range"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-team-day"] });
      queryClient.invalidateQueries({ queryKey: ["tasksByColor"] });
      queryClient.invalidateQueries({ queryKey: ["tasksByTag"] });
      queryClient.invalidateQueries({ queryKey: ["tasksByGradeStage"] });
      queryClient.invalidateQueries({ queryKey: ["surveyDashboard"] });
    },

    onError: (error) => {
      console.error("Error:", error);
      message.error("שגיאה בביצוע הפעולה");
    },
  });
  const copyTask = async (id: number) => {
    const result = await duplicateTask(id);
    if (result.success) {
      Notification({ type: "success", msg: "המשימה שוכפלה" });
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });
    } else {
      Notification({ type: "error", msg: result.message ?? "שגיאה בשכפול" });
    }
  };

  const iconStyle: React.CSSProperties = {
    color: "#000",
    fontSize: "14px",
    marginLeft: "6px",
  };

  const renderOriginIndicator = () => {
    // משימה שנוצרה על ידי מפקד צוות
    if (isCreatedByCurrentTeam) {
      return (
        <Tooltip title="משימה שנוצרה בהיררכיית הצוות">
          <TeamOutlined style={iconStyle} />
        </Tooltip>
      );
    }
    // משימה שנוצרה בהיררכיה גבוהה
    return (
      <Tooltip title="משימה שנוצרה בהיררכיית הקהדיה">
        <LockOutlined style={iconStyle} />
      </Tooltip>
    );
  };

  const renderHiddenIndicator = (task: any) => {
    if (task.hidden !== true) {
      return null;
    }
    return (
      <Tooltip title="משימה מוסתרת - החניך לא יראה משימה זו">
        <EyeInvisibleOutlined style={iconStyle} />
      </Tooltip>
    );
  };

  useEffect(() => {}, [task]);

  const isWhiteColor = (color?: string) => {
    if (!color) return false;
    const normalized = color.toLowerCase().trim();
    return (
      normalized === "#ffffff" ||
      normalized === "#fff" ||
      normalized === "white" ||
      normalized === "rgb(255,255,255)"
    );
  };

  const isWhite = isWhiteColor(gradient?.from) || isWhiteColor(gradient?.to);

  return (
    <div
      style={
        {
          ...styleProps,
          "--border-color": isWhite ? "rgba(0, 0, 0, 0.15)" : "transparent",
          transition: "box-shadow 0.3s ease",
          zIndex: isFiltered ? 1000 : undefined,
          position: isFiltered ? "relative" : undefined,
        } as React.CSSProperties
      }
      className={`draggable-task ${
        isFiltered ? style["highlighted-task"] : ""
      }`}
      data-title={task.name}
      data-has-queue-task={task.has_queue_task}
      task-id={task.id}
      data-task-id={task.id}
      data-duration={task?.recommendedTime?.toString() ?? "60"}
      id={task.id}
    >
      <div
        className={
          task.assigned || task.has_queue_task
            ? style["task-card"]
            : style["task-card-not-assigned"]
        }
        style={
          task.assignedcount > 0
            ? { backgroundColor: "#f4f1eb" }
            : currentUrl === "/calendar"
            ? { width: "230px" }
            : {}
        }
      >
        <div className={style["task-header"]}>
          <div style={{ display: "flex", alignItems: "center", width: "80%" }}>
            <span
              style={{
                flex: 1,
                marginRight: "1vw",
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.7 : 1,
              }}
              className={style["task-title"]}
              onClick={() => handleOpenTaskModal(task)}
            >
              {stringCheckAndToolTip(task.name, 18)}
            </span>

            {renderHiddenIndicator(task)}
            {renderOriginIndicator()}
          </div>

          {!fromGradeStage &&
            !isLocked &&
            activeHeaderType !== "teamMember" &&
            items &&
            items.length > 0 && (
              <Dropdown
                placement="bottomLeft"
                menu={{ items: items }}
                trigger={["click"]}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <MoreOutlined
                    style={{
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  />
                </div>
              </Dropdown>
            )}
          {
            // =============================================
            // מצב: אין שיבוצים בכלל (length == 0)
            // =============================================
            activeHeaderType === "teamMember" &&
              selectedPermission?.role_code !== "STUDENT" &&
              task?.allAssignments?.length === 0 && (
                <Tooltip
                  title={
                    task?.has_queue_task ? "הסר חניך מהתור" : "העבר חניך לתור"
                  }
                >
                  <Button
                    type="text"
                    size="small"
                    icon={
                      task.has_queue_task ? (
                        <MinusCircleOutlined />
                      ) : (
                        <UnorderedListOutlined />
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      queueMutation.mutate({
                        taskId: task.id,
                        isQueueTask: task.has_queue_task,
                        taskAssignmentId: task.has_queue_task
                          ? task.taskAssignmentId || task?.task_assignment_id
                          : undefined,
                      });
                    }}
                  />
                </Tooltip>
              )
          }

          {
            // =============================================
            // מצב: יש שיבוצים + יש כבר בתור → הסר מהתור
            // =============================================
            activeHeaderType === "teamMember" &&
              selectedPermission?.role_code !== "STUDENT" &&
              task?.allAssignments?.length > 0 &&
              task.allAssignments.some((a: any) => a.has_queue_task) && (
                <Tooltip title="הסר חניך מהתור">
                  <Button
                    type="text"
                    size="small"
                    icon={<MinusCircleOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      const queueAssignment = task.allAssignments.find(
                        (a: any) => a.has_queue_task
                      );
                      queueMutation.mutate({
                        taskId: task.id,
                        isQueueTask: true,
                        taskAssignmentId: queueAssignment.task_assignment_id,
                      });
                    }}
                  />
                </Tooltip>
              )
          }

          {
            // =============================================
            // מצב: יש שיבוצים + אין בתור → צור מופע חדש בתור
            // =============================================
            activeHeaderType === "teamMember" &&
              selectedPermission?.role_code !== "STUDENT" &&
              task?.allAssignments?.length > 0 &&
              !task.allAssignments.some((a: any) => a.has_queue_task) && (
                <Tooltip title="צור מופע חדש של המשימה לחניך בתור (יצור משימה חדשה)">
                  <Button
                    type="text"
                    size="small"
                    icon={<UnorderedListOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      queueMutation.mutate({
                        taskId: task.id,
                        isQueueTask: false,
                        taskAssignmentId: undefined,
                      });
                    }}
                  />
                </Tooltip>
              )
          }
          {isLocked && !fromGradeStage && (
            <Tooltip title="משימה זו נעולה">
              <LockOutlined
                style={{
                  cursor: "not-allowed",
                  fontSize: "14px",
                  opacity: 0.6,
                  color: "rgba(255,255,255,0.8)",
                }}
              />
            </Tooltip>
          )}
        </div>

        {task.has_queue_task ? (
          // ✅ אפשרות 1: משימה בתור
          <div className={style.select}>
            <Tag
              style={{
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                margin: 0,
                backgroundColor: "#f5f5f5",
                color: "#595959",
                border: "1px solid #d9d9d9",
                fontSize: "13px",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
            >
              {!task.queue_assignments_count && <span>תור</span>}
              {task.queue_assignments_count > 0 && (
                <span
                  style={{
                    backgroundColor: "#e6e6e6",
                    borderRadius: "10px",
                    padding: "1px 8px",
                    fontSize: "12px",
                    color: "#8c8c8c",
                  }}
                >
                  {task.queue_assignments_count} חניכים בתור
                </span>
              )}
            </Tag>
            {activeHeaderType === "teamMember" && <TaskUserTag task={task} />}
          </div>
        ) : task.allAssignments?.length > 0 ? (
          // ✅ אפשרות 2: משימה עם שיבוצים
          <TaskWithAssignments
            task={task}
            activeHeaderType={activeHeaderType}
            fromGradeStage={fromGradeStage}
          />
        ) : activeHeaderType === "teamMember" && !fromGradeStage ? (
          // ✅ אפשרות 3: teamMember mode
          <TaskUserTag task={task} />
        ) : !fromGradeStage ? (
          // ✅ אפשרות 4: team mode
          <TaskTeamTag task={task} fromCourseContent={true} />
        ) : null}
      </div>
      {openUserModal && (
        <UserTaskModal
          taskGroupName={taskGroupName}
          taskId={task.id}
          task={task}
          openModal={openUserModal}
          setOpenModal={setOpenUserModal}
        />
      )}
      {openTeamMissionModal && (
        <TeamTaskModal
          taskGroupName={taskGroupName}
          taskId={task.id}
          task={task}
          openModal={openTeamMissionModal}
          setOpenModal={setOpenTeamMissionModal}
        />
      )}
    </div>
  );
};

export default Task;
