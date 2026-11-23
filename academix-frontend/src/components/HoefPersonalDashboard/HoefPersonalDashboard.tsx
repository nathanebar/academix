"use client";
import React, { useState, useMemo } from "react";
import {
  Card,
  Tag,
  Avatar,
  Badge,
  Empty,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
  Statistic,
  Button,
  Tooltip,
  notification,
  DatePicker,
  List,
  Timeline,
  Divider,
  Segmented,
  Breadcrumb,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/he";
import relativeTime from "dayjs/plugin/relativeTime";
import styles from "./HoefPersonalDashboard.module.css";
import { useHoefTeamSummary } from "../../hooks/useHoefAssignment";
import { useSelectionsStore } from "../../store/selectionStore";
import { usePermissionStore } from "../../store/permissionStore";
import { useFilteredData } from "../../hooks/useFilteredData";
import { UserTaskModal } from "../LazyTaskModals";
import TaskUserTag from "../Task/TaskTag/TaskUserTag";

dayjs.locale("he");
dayjs.extend(relativeTime);
const { Title, Text } = Typography;

// ==========================================
// 📊 Types
// ==========================================

interface AssignedUser {
  team_member_id?: number | null;
  member_id: number | null;
  user_id: number | null;
  user_name: string | null;
  member_role: string | null;
}

interface HoefTaskItem {
  id: number | null;
  task_assignment_id: number;
  task_id: number;
  task_name: string;
  task_color: string;
  deadline: string | null;
  completed: boolean;
  task_completed_at?: string | null; // ✅ הוספתי לצורך המודל
  daysUntilDeadline: number | null;
  status: string;
  assignedTo: AssignedUser;
  // ✅ שדות Form
  formId?: number | null;
  form_score?: number | null;
  form_completed_at?: string | null;
  form_started_at?: string | null;
  max_score?: number;
  scorePercentage?: number | null;
}

interface HoefData {
  id: number | null;
  hoef_member_id: number;
  hoef_user_id: number;
  name: string;
  userName?: string;
  email?: string;
  tasks: HoefTaskItem[];
  stats: {
    total: number;
    overdue: number;
    upcoming: number;
    noDeadline: number;
    completed: number;
    completionRate: number;
  };
}

type TaskFilterType = "all" | "pending" | "executed" | "approved";

// ==========================================
// 🎯 Task Card Component
// ==========================================

interface TaskCardProps {
  task: HoefTaskItem;
  onDeadlineEdit?: (taskId: number | null, deadline: string | null) => void;
  onTaskClick?: (task: HoefTaskItem) => void; // ✅ הוסף prop לפתיחת מודל
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDeadlineEdit,
  onTaskClick,
}) => {
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  const getStatusConfig = () => {
    if (task.completed) {
      return {
        color: "#52c41a",
        bgColor: "#f6ffed",
        borderColor: "#b7eb8f",
        icon: <CheckCircleOutlined />,
        text: "הושלמה",
        tagColor: "success" as const,
      };
    }
    if (task.status === "overdue") {
      return {
        color: "#ff4d4f",
        bgColor: "#fff2f0",
        borderColor: "#ffccc7",
        icon: <ExclamationCircleOutlined />,
        text: `באיחור של ${task.daysUntilDeadline} ימים`,
        tagColor: "error" as const,
      };
    }
    if (task.daysUntilDeadline === 0) {
      return {
        color: "#ff4d4f",
        bgColor: "#fff2f0",
        borderColor: "#ffccc7",
        icon: <ExclamationCircleOutlined />,
        text: "היום!",
        tagColor: "error" as const,
      };
    }
    if (task.daysUntilDeadline !== null && task.daysUntilDeadline <= 3) {
      return {
        color: "#faad14",
        bgColor: "#fffbe6",
        borderColor: "#ffe58f",
        icon: <FieldTimeOutlined />,
        text: `עוד ${task.daysUntilDeadline} ימים`,
        tagColor: "warning" as const,
      };
    }
    if (task.daysUntilDeadline !== null) {
      return {
        color: "#1890ff",
        bgColor: "#e6f7ff",
        borderColor: "#91d5ff",
        icon: <ClockCircleOutlined />,
        text: `עוד ${task.daysUntilDeadline} ימים`,
        tagColor: "processing" as const,
      };
    }
    return {
      color: "#8c8c8c",
      bgColor: "#fafafa",
      borderColor: "#d9d9d9",
      icon: <ClockCircleOutlined />,
      text: "ללא דדליין",
      tagColor: "default" as const,
    };
  };

  const statusConfig = getStatusConfig();

  const getDeadlineDisplayText = () => {
    if (task.status === "overdue") {
      return `באיחור של ${task.daysUntilDeadline} ימים`;
    }
    if (task.daysUntilDeadline === 0) {
      return "היום!";
    }
    if (task.deadline) {
      return dayjs(task.deadline).format("DD/MM/YYYY HH:mm");
    }
    return "ללא דדליין";
  };

  const getDeadlineClass = () => {
    if (task.status === "overdue") return styles.deadlineTextOverdue;
    if (task.daysUntilDeadline === 0) return styles.deadlineTextUrgent;
    if (task.daysUntilDeadline !== null && task.daysUntilDeadline <= 3)
      return styles.deadlineTextUpcoming;
    return styles.deadlineTextOk;
  };

  return (
    <Card
      className={`${styles.taskCard} ${
        task.completed ? styles.taskCardCompleted : ""
      }`}
      style={{
        borderRight: `4px solid ${task.task_color}`,
        background: statusConfig.bgColor,
        cursor: "pointer", // ✅ הוספתי - מצביע שזה לחיץ
      }}
      bodyStyle={{ padding: 0 }}
      onClick={() => onTaskClick?.(task)} // ✅ הוספתי - פתיחת מודל בלחיצה
    >
      <div className={styles.taskCardContent}>
        {/* Header */}
        <div className={styles.taskCardHeader}>
          <div className={styles.taskInfoSection}>
            <div className={styles.taskNameRow}>
              <Text strong className={styles.taskName}>
                {task.task_name}
              </Text>
              {task.completed && (
                <Tag
                  color="success"
                  icon={<CheckCircleOutlined />}
                  className={styles.completedTag}
                >
                  הושלמה
                </Tag>
              )}
            </div>
            {/* Assigned To */}
            {task.assignedTo?.user_name && (
              <div className={styles.assignedToRow}>
                <UserOutlined className={styles.assignedIcon} />
                <Text type="secondary" className={styles.assignedText}>
                  {task.assignedTo.user_name}
                </Text>
              </div>
            )}
          </div>
          {/* Status Tag */}
          <Tag
            color={statusConfig.tagColor}
            icon={statusConfig.icon}
            className={styles.statusTag}
          >
            {statusConfig.text}
          </Tag>
        </div>

        <Divider className={styles.taskDivider} />

        {/* Deadline Section */}
        <div className={styles.deadlineSection}>
          {isEditingDeadline ? (
            <div className={styles.deadlineEditor}>
              <CalendarOutlined className={styles.deadlineIcon} />
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                placeholder="בחר דדליין"
                value={task.deadline ? dayjs(task.deadline) : null}
                onChange={(date) => {
                  if (date) {
                    onDeadlineEdit?.(task.id!, date.toISOString());
                  }
                  setIsEditingDeadline(false);
                }}
                autoFocus
                className={styles.deadlinePicker}
              />
              <Button
                size="small"
                type="text"
                onClick={() => setIsEditingDeadline(false)}
              >
                ביטול
              </Button>
            </div>
          ) : (
            <div className={styles.deadlineDisplay}>
              <CalendarOutlined className={styles.deadlineIcon} />
              <span className={`${styles.deadlineText} ${getDeadlineClass()}`}>
                {getDeadlineDisplayText()}
              </span>

              <div onClick={(e) => e.stopPropagation()}>
                <TaskUserTag task={task as any} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// ==========================================
// 🎯 Progress Ring Component
// ==========================================

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 120,
  strokeWidth = 8,
  color = "#1890ff",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={styles.progressRingContainer}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className={styles.progressRingSvg}>
        <circle
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 0.5s ease",
          }}
        />
      </svg>
      <div className={styles.progressRingContent}>
        <Text strong className={styles.progressRingPercent}>
          {percent}%
        </Text>
        <Text type="secondary" className={styles.progressRingLabel}>
          הושלמו
        </Text>
      </div>
    </div>
  );
};

// ==========================================
// 🎯 Main Component
// ==========================================

const HoefPersonalDashboard: React.FC = () => {
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>("pending");
  const { selectedTeam } = useSelectionsStore();
  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );
  const { filteredTeamMembers } = useFilteredData();

  // ✅ הוסף - State למודל משימה
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);

  // מצא את החופף הנוכחי
  const currentHoefFromList = filteredTeamMembers?.find(
    (item) =>
      item.team_id === selectedTeam.id &&
      item.user_id === selectedPermission?.user_id
  );

  const {
    data: hoefsData,
    isLoading: hoefsLoading,
    error: hoefsError,
    refetch,
  } = useHoefTeamSummary(selectedTeam?.id);

  // מצא את הנתונים של החופף הנוכחי
  const currentHoef = useMemo((): HoefData | null => {
    if (!hoefsData || !currentHoefFromList?.id) return null;
    return (
      hoefsData.find(
        (h: HoefData) => h.hoef_member_id === currentHoefFromList.id
      ) || null
    );
  }, [hoefsData, currentHoefFromList?.id]);

  // ✅ הוסף - Handler לפתיחת מודל משימה
  const handleOpenTaskModal = (task: HoefTaskItem) => {
    setSelectedTaskForModal(task);
  };

  // ✅ הוסף - Handler לסגירת מודל משימה
  const handleCloseTaskModal = () => {
    setSelectedTaskForModal(null);
  };

  // סינון משימות
  const filteredTasks = useMemo((): HoefTaskItem[] => {
    if (!currentHoef) return [];
    switch (taskFilter) {
      case "pending":
        return currentHoef.tasks.filter((t: HoefTaskItem) => !t.completed);
      case "approved":
        return currentHoef.tasks.filter((t: HoefTaskItem) => t.completed);
      default:
        return currentHoef.tasks;
    }
  }, [currentHoef, taskFilter]);

  // ספירות
  const taskCounts = useMemo(() => {
    if (!currentHoef) return { all: 0, pending: 0, executed: 0, approved: 0 };
    return {
      all: currentHoef.tasks.length,
      pending: currentHoef.tasks.filter((t: HoefTaskItem) => !t.completed)
        .length,
      executed: currentHoef.tasks.filter((t: HoefTaskItem) => !t.completed)
        .length,
      approved: currentHoef.tasks.filter((t: HoefTaskItem) => t.completed)
        .length,
    };
  }, [currentHoef]);

  // דדליינים קרובים (לא באיחור)
  const upcomingDeadlines = useMemo(() => {
    if (!currentHoef) return [];
    return currentHoef.tasks
      .filter(
        (t: HoefTaskItem) =>
          !t.completed &&
          t.deadline &&
          t.status !== "overdue" &&
          t.daysUntilDeadline !== null
      )
      .sort((a, b) => (a.daysUntilDeadline || 0) - (b.daysUntilDeadline || 0))
      .slice(0, 5);
  }, [currentHoef]);

  // משימות באיחור
  const overdueTasks = useMemo(() => {
    if (!currentHoef) return [];
    return currentHoef.tasks.filter(
      (t: HoefTaskItem) => !t.completed && t.status === "overdue"
    );
  }, [currentHoef]);

  // Loading state
  if (hoefsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Text>טוען נתונים...</Text>
      </div>
    );
  }

  // Error state
  if (hoefsError) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message="שגיאה בטעינת הנתונים"
          description={hoefsError.message}
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
        />
      </div>
    );
  }

  // No hoef found
  if (!currentHoef) {
    return (
      <div className={styles.notFoundContainer}>
        <Alert
          message="לא נמצא חופף"
          description="אינך חופף בצוות הנבחר"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className={styles.container} dir="rtl">
      {/* Main Content */}
      <div className={styles.mainContent}>
        <Row gutter={[24, 24]}>
          {/* Left Column */}
          <Col xs={24} lg={8}>
            {/* Progress Card */}
            <Card className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <TrophyOutlined className={styles.progressIcon} />
                <Text strong className={styles.progressTitle}>
                  התקדמות אישית
                </Text>
              </div>
              <div className={styles.progressRingWrapper}>
                <ProgressRing
                  percent={currentHoef.stats.completionRate}
                  size={140}
                  strokeWidth={12}
                  color="#52c41a"
                />
              </div>
              <div className={styles.progressStats}>
                <div className={styles.progressStatItem}>
                  <Text type="secondary">הושלמו</Text>
                  <Text
                    strong
                    className={styles.progressStatValue}
                    style={{ color: "#52c41a" }}
                  >
                    {currentHoef.stats.completed} / {currentHoef.stats.total}
                  </Text>
                </div>
              </div>
            </Card>

            {overdueTasks.length > 0 && (
              <Alert
                className={styles.overdueAlert}
                type="error"
                showIcon
                icon={<WarningOutlined />}
                message={
                  <div>
                    <Text strong>
                      יש לך {overdueTasks.length} משימות באיחור!
                    </Text>
                    <br />
                    <Text type="secondary">יש לטפל בהן בהקדם האפשרי</Text>
                  </div>
                }
              />
            )}

            {/* Upcoming Deadlines */}
            {upcomingDeadlines.length > 0 && (
              <Card
                className={styles.upcomingCard}
                title={
                  <div className={styles.cardTitle}>
                    <CalendarOutlined />
                    <span>דדליינים קרובים</span>
                    <Badge count={upcomingDeadlines.length} size="small" />
                  </div>
                }
              >
                <List
                  dataSource={upcomingDeadlines}
                  renderItem={(task: HoefTaskItem) => (
                    <List.Item className={styles.upcomingItem}>
                      <div
                        className={styles.upcomingColor}
                        style={{ backgroundColor: task.task_color }}
                      />
                      <div className={styles.upcomingInfo}>
                        <Text ellipsis className={styles.upcomingTaskName}>
                          {task.task_name}
                        </Text>
                        <div className={styles.upcomingDeadline}>
                          <CalendarOutlined />
                          <Text type="secondary">
                            {dayjs(task.deadline).format("DD/MM")} -{" "}
                            <Text
                              strong
                              style={{
                                color:
                                  task.daysUntilDeadline === 0
                                    ? "#ff4d4f"
                                    : "#faad14",
                              }}
                            >
                              {task.daysUntilDeadline === 0
                                ? "היום!"
                                : `עוד ${task.daysUntilDeadline} ימים`}
                            </Text>
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={16}>
            <Card
              className={styles.tasksCard}
              title={
                <div className={styles.cardTitle}>
                  <UnorderedListOutlined />
                  <span>משימות נחפפים ששויכו</span>
                  <Tag>{taskCounts.all} משימות</Tag>
                </div>
              }
              extra={
                <div className={styles.filterChips}>
                  <Badge
                    count={taskCounts.pending}
                    size="small"
                    showZero
                    color={taskCounts.pending > 0 ? "#1677ff" : "#d9d9d9"}
                  >
                    <Button
                      type={taskFilter === "pending" ? "primary" : "default"}
                      shape="round"
                      size="small"
                      onClick={() => setTaskFilter("pending")}
                      icon={<ClockCircleOutlined />}
                    >
                      ממתינות
                    </Button>
                  </Badge>

                  <Badge
                    count={taskCounts.approved}
                    size="small"
                    showZero
                    color={taskCounts.approved > 0 ? "#52c41a" : "#d9d9d9"}
                  >
                    <Button
                      type={taskFilter === "approved" ? "primary" : "default"}
                      shape="round"
                      size="small"
                      onClick={() => setTaskFilter("approved")}
                      icon={<CheckCircleOutlined />}
                    >
                      אושרו
                    </Button>
                  </Badge>

                  <Button
                    type={taskFilter === "all" ? "primary" : "default"}
                    shape="round"
                    size="small"
                    onClick={() => setTaskFilter("all")}
                    icon={<UnorderedListOutlined />}
                  >
                    הכל ({taskCounts.all})
                  </Button>
                </div>
              }
            >
              {filteredTasks.length === 0 ? (
                <Empty
                  description={
                    taskFilter === "approved"
                      ? "אין משימות שאושרו עדיין"
                      : "אין משימות ממתינות"
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className={styles.emptyTasks}
                >
                  {taskFilter !== "all" && (
                    <Button type="primary" onClick={() => setTaskFilter("all")}>
                      צפה בכל המשימות
                    </Button>
                  )}
                </Empty>
              ) : (
                <div className={styles.tasksList}>
                  {filteredTasks.map((task: HoefTaskItem) => (
                    <TaskCard
                      key={task.id || task.task_assignment_id}
                      task={task}
                      onDeadlineEdit={() => refetch()}
                      onTaskClick={handleOpenTaskModal} // ✅ הוספתי - פתיחת מודל
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* Timeline */}
            <Card
              className={styles.activityCard}
              title={
                <div className={styles.cardTitle}>
                  <FieldTimeOutlined />
                  <span>פעילות אחרונה</span>
                </div>
              }
            >
              <Timeline
                items={[
                  {
                    color: currentHoef.stats.completed > 0 ? "green" : "gray",
                    children: (
                      <div className={styles.timelineItem}>
                        <Text>הושלמו {currentHoef.stats.completed} משימות</Text>
                        <Tag color="success">
                          <CheckOutlined /> {currentHoef.stats.completionRate}%
                        </Tag>
                      </div>
                    ),
                  },
                  {
                    color: currentHoef.stats.overdue > 0 ? "red" : "gray",
                    children: (
                      <div className={styles.timelineItem}>
                        <Text>
                          {currentHoef.stats.overdue > 0
                            ? `${currentHoef.stats.overdue} משימות באיחור`
                            : "אין משימות באיחור"}
                        </Text>
                        {currentHoef.stats.overdue > 0 && (
                          <Tag color="error">
                            <WarningOutlined /> דחוף
                          </Tag>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* ✅ הוסף - UserTaskModal */}
      {selectedTaskForModal && (
        <UserTaskModal
          // taskGroupName="hoef"
          taskId={Number(selectedTaskForModal?.task_id)}
          task={selectedTaskForModal}
          openModal={selectedTaskForModal}
          setOpenModal={setSelectedTaskForModal}
          setSelectedEvent={setSelectedTaskForModal}
          completed_at={selectedTaskForModal?.task_completed_at}
          onRefresh={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default HoefPersonalDashboard;
