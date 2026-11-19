import React, { useMemo, useState } from "react";
import { Tag, Spin } from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  CaretDownFilled,
  CaretLeftFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import style from "./TasksQueuePanel.module.css";
import { Assignment, QueueTask } from "../../types/types";
import TaskUserTag from "../../components/Task/TaskTag/TaskUserTag";
import TaskTeamTag from "../../components/Task/TaskTag/TaskTeamTag";
import { useSelectionsStore } from "../../store/selectionStore";
import { usePermissionStore } from "../../store/permissionStore";

dayjs.extend(relativeTime);
dayjs.extend(duration);

// ============================================================
// סטטוס משיב - אותו חישוב בדיוק כמו ב-TaskUserTag
// ============================================================
type MemberStatus =
  | "NOT_ASSIGNED"
  | "ASSIGNED"
  | "DONE"
  | "APPROVED"
  | "NOTREQUIREDTOSUBMIT";

type QueueGroupKey = "inProcess" | "approved" | "completed";

interface QueueGroupConfig {
  key: QueueGroupKey;
  title: string;
  /** אילו סטטוסי משיב נכנסים לקבוצה */
  statuses: MemberStatus[];
  /** האם הקבוצה פתוחה כברירת מחדל */
  defaultOpen: boolean;
}

const QUEUE_GROUPS: QueueGroupConfig[] = [
  {
    key: "inProcess",
    title: "משימות בתהליך",
    statuses: ["ASSIGNED", "NOT_ASSIGNED", "NOTREQUIREDTOSUBMIT"],
    defaultOpen: true,
  },
  {
    key: "approved",
    title: "משימות שאושרו",
    statuses: ["APPROVED"],
    defaultOpen: false,
  },
  {
    key: "completed",
    title: "משימות שבוצעו",
    statuses: ["DONE"],
    defaultOpen: false,
  },
];

const getAssignmentStatus = (a: Assignment): MemberStatus => {
  if (a?.notRequiredToSubmit && a.assigned != null) {
    return "NOTREQUIREDTOSUBMIT";
  }
  if (a?.completed_at != null && a?.completed != null) {
    return "APPROVED"; // בוצע ומאושר
  }
  if (a?.completed_at != null) {
    return "DONE"; // בוצע
  }
  if (a?.assigned != null || (a?.has_queue_task && a?.completed_at == null)) {
    return "ASSIGNED"; // בתהליך
  }
  return "NOT_ASSIGNED";
};

// כל קבוצה: תרגילים, כשכל תרגיל מחזיק רק את המשיבים ששייכים לאותה קבוצה
interface GroupedEntry {
  task: QueueTask;
  assignments: Assignment[];
}

interface TasksQueuePanelProps {
  tasks: QueueTask[];
  isLoading: boolean;
  onTaskClick: (task: QueueTask) => void;
  onAssignmentClick: (task: QueueTask, assignment: Assignment) => void;
}

const TasksQueuePanel: React.FC<TasksQueuePanelProps> = ({
  tasks,
  isLoading,
  onTaskClick,
  onAssignmentClick,
}) => {
  const {
    selectedCourse,
    selectedTeam,
    activeHeaderType,
    selectedDate,
    selectedTeamMember,
    selectedCourseBatch,
    setSelectedDate,
    setActiveHeaderType,
  } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();

  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<QueueGroupKey, boolean>
  >(() =>
    QUEUE_GROUPS.reduce(
      (acc, group) => {
        acc[group.key] = !group.defaultOpen;
        return acc;
      },
      {} as Record<QueueGroupKey, boolean>
    )
  );

  const toggleGroup = (key: QueueGroupKey) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // מפריד את המשיבים של כל תרגיל לפי הסטטוס שלהם
  // כך שכל חניך נספר בקבוצה שלו - תרגיל יכול להופיע ביותר מקבוצה אחת
  const groupedTasks = useMemo<Record<QueueGroupKey, GroupedEntry[]>>(() => {
    const result: Record<QueueGroupKey, GroupedEntry[]> = {
      inProcess: [],
      approved: [],
      completed: [],
    };

    (tasks ?? []).forEach((task) => {
      const assignments = task?.assignments ?? [];

      if (assignments.length === 0) {
        result.inProcess.push({ task, assignments: [] });
        return;
      }

      const inProcess = assignments.filter((a) =>
        QUEUE_GROUPS[0].statuses.includes(getAssignmentStatus(a))
      );
      const approved = assignments.filter(
        (a) => getAssignmentStatus(a) === "APPROVED"
      );
      const done = assignments.filter(
        (a) => getAssignmentStatus(a) === "DONE"
      );

      if (inProcess.length > 0)
        result.inProcess.push({ task, assignments: inProcess });
      if (approved.length > 0)
        result.approved.push({ task, assignments: approved });
      if (done.length > 0) result.completed.push({ task, assignments: done });
    });

    return result;
  }, [tasks]);

  // ✅ סכום כל המשיבים בפאנל (במקום מספר קובצי המשימה)
  const totalAssignments = useMemo(
    () =>
      (tasks ?? []).reduce(
        (sum, t) => sum + (t?.assignments?.length || 0),
        0
      ),
    [tasks]
  );

  const formatTime = (dateString: string): string => {
    return dayjs(dateString).format("HH:mm");
  };

  const formatDate = (dateString: string): string => {
    const date = dayjs(dateString);
    const now = dayjs();

    if (date.isSame(now, "day")) {
      return "היום";
    } else if (date.isSame(now.add(1, "day"), "day")) {
      return "מחר";
    } else if (date.isSame(now.subtract(1, "day"), "day")) {
      return "אתמול";
    }
    return date.format("D/M");
  };

  const renderTaskCard = (entry: GroupedEntry) => {
    const { task, assignments } = entry;
    return (
      <div
        key={task.task_id}
        className={style.taskCard}
        onClick={() => onTaskClick(task)}
      >
        {/* כותרת המשימה */}
        <div className={style.cardHeader}>
          <div
            className={style.taskIndicator}
            style={{
              backgroundColor:
                selectedPermission?.role_code !== "STUDENT"
                  ? task.task_color || "#3b82f6"
                  : "",
            }}
          />
          <div className={style.taskInfo}>
            <span className={style.taskName}>{task.name}</span>
            <span className={style.groupName}>
              {selectedPermission?.role_code !== "STUDENT" && task.group_name}
            </span>
          </div>
          <Tag
            className={style.countTag}
            style={{
              backgroundColor: task.axis_color
                ? `${task.axis_color}20`
                : "#f1f5f9",
              color: task.axis_color || "#64748b",
              borderColor: task.axis_color
                ? `${task.axis_color}40`
                : "#e2e8f0",
            }}
          >
            {assignments.length}
          </Tag>
        </div>

        {/* רשימת משיבים - רק אלה שבסטטוס של הקבוצה הזו */}
        <div className={style.assignmentsList}>
          {assignments.slice(0, 3).map((assignment) => (
            <div
              key={assignment.id}
              className={style.assignmentItem}
              onClick={(e) => {
                e.stopPropagation();
                onAssignmentClick(task, assignment);
              }}
            >
              <div className={style.assignmentRight}>
                <UserOutlined className={style.userIcon} />
                <div className={style.assignmentInfo}>
                  <span className={style.memberName}>
                    {assignment.memberName || "ללא שם"}
                  </span>
                </div>
              </div>
              <div
                className={style["twoWeeksTaskProgress"]}
                style={{ padding: 10 }}
              >
                <TaskUserTag task={assignment} />
              </div>

              <div className={style.assignmentLeft}>
                <span className={style.assignmentTime}>
                  {formatDate(assignment.createdAt)} •{" "}
                  {formatTime(assignment.createdAt)}
                </span>
              </div>
            </div>
          ))}

          {assignments.length > 3 && (
            <div className={style.moreAssignments}>
              +{assignments.length - 3} נוספים
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={style.panel}>
      {/* כותרת */}
      <div className={style.header}>
        {/* ✅ סופר את סכום המשיבים, לא את קובצי המשימה */}
        <span className={style.badge}>{totalAssignments}</span>
        <div className={style.headerRight}>
          <span className={style.headerTitle}>משימות בתור</span>
        </div>
      </div>

      {/* תוכן */}
      <div className={style.list}>
        {isLoading ? (
          <div className={style.loadingState}>
            <Spin size="large" />
            <span>טוען משימות...</span>
          </div>
        ) : (tasks?.length ?? 0) === 0 ? (
          <div className={style.emptyState}>
            <CheckCircleOutlined className={style.emptyIcon} />
            <span className={style.emptyText}>אין משימות בתור</span>
            <span className={style.emptyHint}>
              המשימות יופיעו כאן כשיהיו בתור
            </span>
          </div>
        ) : (
          QUEUE_GROUPS.map((group) => {
            const groupEntries = groupedTasks[group.key];
            const isCollapsed = collapsedGroups[group.key];
            // ✅ סכום המשיבים בקבוצה (במקום מספר התרגילים)
            const groupCount = groupEntries.reduce(
              (sum, entry) => sum + entry.assignments.length,
              0
            );
            return (
              <div key={group.key} className={style.group}>
                {/* כותרת הקבוצה עם חץ */}
                <div
                  className={style.groupHeader}
                  onClick={() => toggleGroup(group.key)}
                >
                  {isCollapsed ? (
                    <CaretLeftFilled className={style.groupChevron} />
                  ) : (
                    <CaretDownFilled className={style.groupChevron} />
                  )}
                  <span className={style.groupTitle}>{group.title}</span>
                  <Tag
                    className={style.groupCount}
                    style={{
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      borderColor: "#bfdbfe",
                    }}
                  >
                    {groupCount}
                  </Tag>
                </div>

                {/* תוכן הקבוצה */}
                {!isCollapsed && (
                  <div className={style.groupContent}>
                    {groupEntries.length === 0 ? (
                      <div className={style.groupEmpty}>אין משימות</div>
                    ) : (
                      groupEntries.map((entry) => renderTaskCard(entry))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TasksQueuePanel;