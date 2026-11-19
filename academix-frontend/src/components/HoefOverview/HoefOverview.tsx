"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  Tag,
  Avatar,
  Progress,
  Tabs,
  Empty,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
  Statistic,
  Button,
  Drawer,
  Tooltip,
  message,
  notification,
  DatePicker,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  CloseOutlined,
  PlusCircleOutlined,
  DeleteOutlined,
  InboxOutlined,
  EyeOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import dayjs from "dayjs";
import styles from "./HoefOverview.module.css";
import {
  useDragAssignHoef,
  useHoefTeamSummary,
  useTeamTasks,
} from "../../hooks/useHoefAssignment";
import { HeaderPermissionDisplay } from "../HeaderPermissionDisplay";
import { useSelectionsStore } from "../../store/selectionStore";
import Photo from "../../UI/Photo/Photo";
import UserTaskModal from "../UserTaskModal/UserTaskModal";
import HoefTaskPool from "./HoefTaskPool";
import { HoefData, HoefTaskItem, TaskItem } from "../../types/types";
import { queryClient } from "../../api/queryClient";

const { Title, Text } = Typography;

const convertHoefTaskToTaskItem = (task: HoefTaskItem): TaskItem => {
  return {
    id: typeof task.id === "number" ? task.id : 0,
    task_id: task.task_id,
    task_assignment_id: task.task_assignment_id,
    task_name: task.task_name,
    task_color: task.task_color,
    task_start: task.deadline ?? null,
    task_end: null,
    task_completed: task.completed ?? false,
    task_completed_at: task.completed_at ?? null,
    task_feedback: (task as any).task_feedback ?? null,
    notRequiredToCheck: task.notRequiredToCheck,
    hoef_count:
      typeof task.hoef_count === "number"
        ? task.hoef_count
        : typeof task.hoef_count === "string"
          ? parseInt(String(task.hoef_count)) || 0
          : 0,
    has_hoefs:
      (typeof task.hoef_count === "number"
        ? task.hoef_count
        : typeof task.hoef_count === "string"
          ? parseInt(String(task.hoef_count)) || 0
          : 0) > 0,
    hoefs: (task as any).hoefs ?? [],
    taskGroup: (task as any).taskGroup,
    axis: (task as any).axis,
    assignedTo: task.assignedTo,
    taskRecommendedTime: (task as any).taskRecommendedTime,
    feedback: (task as any).feedback,
  };
};

interface DraggableTaskProps {
  task: TaskItem;
  id: string;
  onTaskClick?: (task: TaskItem) => void;
}
const DraggableTask: React.FC<DraggableTaskProps> = ({
  task,
  id,
  onTaskClick,
}) => {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id,
      data: {
        type: "task",
        task,
      },
    });
  const getItemClasses = () => {
    const classes = [styles.draggableTaskItem];
    if (isDragging) {
      classes.push(styles.dragging);
    } else if (task.task_completed) {
      classes.push(styles.completed);
    } else if (task.has_hoefs) {
      classes.push(styles.hasHoefs);
    } else {
      classes.push(styles.unassigned);
    }
    return classes.filter(Boolean).join(" ");
  };
  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 999,
    }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      className={getItemClasses()}
      style={style}
      {...listeners}
      {...attributes}
    >
      <div className={styles.taskItemContent}>
        <div
          className={styles.taskColor}
          style={{ backgroundColor: task.task_color }}
        />
        <div className={styles.taskInfo}>
          <div className={styles.taskNameRow}>
            <Text className={styles.taskName}>{task.task_name}</Text>
            {task.task_completed && (
              <Tag className={styles.completedTag}>✓ הושלמה</Tag>
            )}
            {task.task_completed_at && !task.task_completed && (
              <Tag color="processing" className={styles.executedTag}>
                ✓ בוצעה
              </Tag>
            )}
            {task.task_feedback && (
              <Tag
                icon={<CommentOutlined />}
                color="cyan"
                className={styles.feedbackTag}
              >
                נדרש למישוב
              </Tag>
            )}
          </div>
          <div className={styles.assignmentRow}>
            <div className={styles.taskAssignmentInfo}>
              <span className={styles.assignedTo}>
                <UserOutlined />
                {task.assignedTo?.user_name || "לא שובץ"}
              </span>
            </div>
            {1 && (
              <Tag
                color={task.hoef_count > 0 ? "blue" : "default"}
                className={styles.hoefBadge}
              >
                {task.hoef_count === 0
                  ? "ללא חופפים"
                  : task.hoef_count === 1
                    ? "שובץ חופף"
                    : `${task.hoef_count} חופפים`}
              </Tag>
            )}
          </div>
        </div>
        <div className={styles.openTaskWrapper}>
          <div className={styles.openTaskRow}>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick?.(task);
              }}
              className={styles.openTaskLink}
            >
              פתח משימה
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
interface HoefDraggableTaskProps {
  task: HoefTaskItem;
  id: string;
  memberId: number;
  onOpenTaskModal: (task: HoefTaskItem, e: React.MouseEvent) => void;
}

const getStatusInfo = (task: HoefTaskItem) => {
  if (task.completed) return { color: "#52c41a", text: "הושלמה", icon: "✓" };
  if (task.status === "overdue")
    return { color: "#ff4d4f", text: "באיחור", icon: "!" };
  if (task.status === "upcoming")
    return { color: "#faad14", text: "מתקרב", icon: "⏰" };
  return { color: "#d9d9d9", text: "ללא דדליין", icon: "—" };
};

const formatDeadline = (deadline: string | null) => {
  if (!deadline) return null;
  return dayjs(deadline).format("DD/MM/YYYY HH:mm");
};

const HoefDraggableTask: React.FC<HoefDraggableTaskProps> = ({
  task,
  id,
  memberId,
  onOpenTaskModal,
}) => {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id,
      data: {
        type: "hoef-task",
        task,
        sourceMemberId: memberId,
      },
    });

  const status = getStatusInfo(task);

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 999,
    }
    : undefined;

  return (
    <Tooltip
      title={
        <div style={{ minWidth: 180 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              marginBottom: 8,
              borderBottom: "1px solid rgba(255,255,255,0.2)",
              paddingBottom: 6,
            }}
          >
            {task.task_name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span style={{ color: status.color, fontWeight: "bold" }}>
              {status.icon}
            </span>
            <span style={{ color: status.color }}>{status.text}</span>
          </div>
          {task.deadline && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <CalendarOutlined style={{ fontSize: 11 }} />
              <span>{formatDeadline(task.deadline)}</span>
            </div>
          )}
          {task.assignedTo?.user_name && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              <UserOutlined style={{ fontSize: 11 }} />
              <span>שובץ ל: {task.assignedTo.user_name}</span>
            </div>
          )}
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 8 }}>
            גרור כדי להעביר בין חופפים
          </div>
        </div>
      }
      placement="top"
      overlayStyle={{ maxWidth: 250 }}
    >
      <div
        ref={setNodeRef}
        className={`${styles.miniTaskRow} ${styles.draggableMiniTask} ${task.completed ? styles.completedTask : ""
          } ${isDragging ? styles.draggingMiniTask : ""}`}
        style={style}
        {...listeners}
        {...attributes}
        onClick={(e) => onOpenTaskModal(task, e)}
      >
        <div
          className={styles.miniTaskColor}
          style={{ backgroundColor: task.task_color }}
        />
        <Text delete={task.completed} ellipsis className={styles.miniTaskName}>
          {task.task_name}
        </Text>
        <div
          className={styles.rightColorBar}
          style={{ backgroundColor: task.task_color }}
        />
      </div>
    </Tooltip>
  );
};

interface DroppableCardProps {
  member: HoefData;
  isOver: boolean;
  onSelect: () => void;
  onOpenTaskModal: (task: HoefTaskItem, e: React.MouseEvent) => void;
  onRefetch?: () => void;
}

const DroppableCard: React.FC<DroppableCardProps> = ({
  member,
  isOver,
  onSelect,
  onOpenTaskModal,
  onRefetch,
}) => {
  const [showOnlyUncompleted, setShowOnlyUncompleted] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { removeTaskFromHoef } = useDragAssignHoef();

  const handleRemoveTask = async (task: HoefTaskItem, e: React.MouseEvent) => {
    e.stopPropagation(); // חשוב! מונע פתיחת המודל
    setRemovingId(task.task_assignment_id);
    const result = await removeTaskFromHoef(
      {
        task_assignment_id: task.task_assignment_id,
        task_name: task.task_name,
      },
      { hoef_member_id: member.hoef_member_id, name: member.name }
    );
    setRemovingId(null);
    if (result.success) {
      queryClient.refetchQueries({
        queryKey: ["tasks-range"],
      });
      notification.success({
        message: "המשימה הוסרה",
        description: result.message,
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      });
      onRefetch?.(); // רענון הנתונים
    } else {
      message.error(result.message);
    }
  };

  const isMifatz = member.member_role === "TEAM_COMMANDER";
  const dropText = isMifatz ? 'למפ"צ' : "לחופף";

  const droppableId = `member-${member.hoef_member_id}`;
  const { setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      type: "member",
      member,
    },
  });

  const hasNoTasks = member.tasks.length === 0;
  const uncompletedCount = member.tasks.filter(
    (task) => !task.completed
  ).length;

  const displayedTasks = useMemo(() => {
    const sorted = [...member.tasks].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return 0;
    });
    return showOnlyUncompleted
      ? sorted.filter((task) => !task.completed)
      : sorted;
  }, [member.tasks, showOnlyUncompleted]);

  const handleShowAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOnlyUncompleted(false);
  };

  const handleShowUncompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOnlyUncompleted(true);
  };

  return (
    <Card
      ref={setNodeRef}
      className={`${styles.hoefCard} ${isOver ? styles.dropActive : ""} ${hasNoTasks ? styles.emptyHoefCard : ""
        }`}
      hoverable={!hasNoTasks}
      onClick={hasNoTasks ? undefined : onSelect}
    >
      <div className={styles.dropIndicator} />
      {isOver && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropOverlayContent}>
            <PlusCircleOutlined className={styles.dropOverlayIcon} />
            <span className={styles.dropOverlayText}>
              שחרר להוספה {dropText}
            </span>
          </div>
        </div>
      )}

      <div className={styles.hoefCardHeader}>
        <div className={styles.hoefAvatarWrapper}>
          <Photo
            username={member.userName}
            style={{
              width: "3.5rem",
              height: "3.5rem",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
        </div>
        <div className={styles.hoefInfo}>
          <Text strong className={styles.hoefName}>
            {member.name}
          </Text>
          <Text type="secondary" className={styles.hoefRole}>
            {isMifatz ? 'מפ"צ' : "חופף"}
          </Text>
        </div>
      </div>

      <div className={styles.taskCountBadge}>{member.tasks.length} משימות</div>

      {hasNoTasks ? (
        <div className={styles.emptyHoefMessage}>
          <InboxOutlined className={styles.emptyIcon} />
          <Text type="secondary">אין משימות משובצות</Text>
          <Text type="secondary" className={styles.dragHint}>
            גרור משימה מהמאגר כדי להוסיף
          </Text>
        </div>
      ) : (
        <>
          <div className={styles.hoefProgress}>
            <div className={styles.progressHeader}>
              <Text type="secondary" className={styles.progressLabel}>
                התקדמות
              </Text>
              <div className={styles.progressPercentContainer}>
                <span className={styles.progressPercentContainerInner}>
                  <span className={styles.progressPercent}>
                    {member.stats.completionRate}%
                  </span>
                  <span className={styles.progressCompletedLabel}>הושלם</span>
                </span>
              </div>
            </div>

            <div className={styles.hoefProgressWrapper}>
              <Progress
                percent={member.stats.completionRate}
                showInfo={false}
                strokeColor="#1e3a5f"
                trailColor="#F4F1EB"
              />
              <div className={styles.progressDots}>
                <div className={styles.progressDot} />
                <div className={styles.progressDot} />
                <div className={styles.progressDot} />
              </div>
            </div>
          </div>

          <div className={styles.hoefBadges}>
            {member.stats.overdue > 0 && (
              <Tag className={styles.overdueTagPill}>
                {member.stats.overdue} באיחור
              </Tag>
            )}
            {member.stats.upcoming > 0 && (
              <Tag className={styles.upcomingTagPill}>
                {member.stats.upcoming} מתקרבים
              </Tag>
            )}
            {member.stats.noDeadline > 0 && (
              <Tag className={styles.noDeadlineTagPill}>
                {member.stats.noDeadline} ללא דדליין
              </Tag>
            )}
          </div>

          <div className={styles.hoefTasksPreview}>
            <div className={styles.previewHeaderRow}>
              <Text type="secondary" className={styles.previewLabel}>
                משימות:
              </Text>

              <div className={styles.taskFilterToggle}>
                <div
                  className={`${styles.taskFilterToggleEllipse} ${showOnlyUncompleted ? styles.left : styles.right
                    }`}
                />

                <button
                  className={`${styles.taskFilterToggleOption} ${!showOnlyUncompleted ? styles.active : ""
                    }`}
                  onClick={handleShowAll}
                >
                  הכל
                </button>

                <button
                  className={`${styles.taskFilterToggleOption} ${showOnlyUncompleted ? styles.active : ""
                    }`}
                  onClick={handleShowUncompleted}
                >
                  לא בוצעו ({uncompletedCount})
                </button>
              </div>
            </div>

            <div className={styles.tasksPreviewList}>
              {displayedTasks.map((task, index) => {
                const status = getStatusInfo(task);
                return (
                  <Tooltip
                    key={`tooltip-${task.task_assignment_id || index}`}
                    title={
                      <div style={{ minWidth: 180 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            marginBottom: 8,
                            borderBottom: "1px solid rgba(255,255,255,0.2)",
                            paddingBottom: 6,
                          }}
                        >
                          {task.task_name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              color: status.color,
                              fontWeight: "bold",
                            }}
                          >
                            {status.icon}
                          </span>
                          <span style={{ color: status.color }}>
                            {status.text}
                          </span>
                        </div>
                        {task.deadline && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 4,
                            }}
                          >
                            <CalendarOutlined style={{ fontSize: 11 }} />
                            <span>{formatDeadline(task.deadline)}</span>
                            {task.daysUntilDeadline !== null && (
                              <span
                                style={{
                                  color:
                                    task.status === "overdue"
                                      ? "#ff4d4f"
                                      : task.status === "upcoming"
                                        ? "#faad14"
                                        : "#8c8c8c",
                                  fontSize: 11,
                                }}
                              >
                                ({`עוד ${task.daysUntilDeadline} ימים`})
                              </span>
                            )}
                          </div>
                        )}
                        {task.assignedTo?.user_name && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 4,
                            }}
                          >
                            <span>שובץ ל: {task.assignedTo.user_name}</span>
                            <UserOutlined style={{ fontSize: 11 }} />
                          </div>
                        )}
                      </div>
                    }
                    placement="top"
                    overlayStyle={{ maxWidth: 250 }}
                  >
                    <div
                      key={`row-${task.task_assignment_id || index}`}
                      className={`${styles.miniTaskRow} ${task.completed ? styles.completedTask : ""
                        }`}
                      title={task.task_name}
                    >
                      <div
                        className={styles.miniTaskColor}
                        style={{ backgroundColor: task.task_color }}
                      />

                      <Text
                        delete={task.completed}
                        ellipsis
                        className={styles.miniTaskName}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTaskModal(task, e);
                        }}
                        style={{ flex: 1, cursor: "pointer" }}
                      >
                        {task.task_name}
                      </Text>

                      {/* כפתור מחיקה עם טולטיפ */}
                      <Tooltip title="הסר מחופף זה">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={removingId === task.task_assignment_id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTask(task, e);
                          }}
                          className={styles.miniTaskDeleteBtn}
                        />
                      </Tooltip>

                      <div
                        className={styles.rightColorBar}
                        style={{ backgroundColor: task.task_color }}
                      />
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {showOnlyUncompleted && displayedTasks.length === 0 && (
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  display: "block",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                כל המשימות בוצעו! ✓
              </Text>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

interface DragOverlayTaskProps {
  task: TaskItem | HoefTaskItem;
  type: "task" | "hoef-task";
}

const DragOverlayTask: React.FC<DragOverlayTaskProps> = ({ task, type }) => (
  <Card
    className={styles.hoefCard}
    style={{
      opacity: 0.95,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      border: "2px solid #595959",
      minWidth: 280,
    }}
  >
    <div className={styles.hoefCardHeader}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: task.task_color,
        }}
      />
      <Text strong style={{ flex: 1 }}>
        {task.task_name}
      </Text>
      <Tag
        color={type === "hoef-task" ? "processing" : "default"}
        icon={<TeamOutlined />}
      >
        {type === "hoef-task" ? "מעבר בין חופפים" : "גורר ל..."}
      </Tag>
    </div>
    {task.assignedTo?.user_name && (
      <Text type="secondary" style={{ fontSize: 12 }}>
        שובץ ל: {task.assignedTo.user_name}
      </Text>
    )}
  </Card>
);

interface HoefDetailsProps {
  hoef: HoefData;
}

const HoefDetails: React.FC<HoefDetailsProps> = ({ hoef }) => {
  const { updateHoefDeadline, removeTaskFromHoef } = useDragAssignHoef();
  const [editingDeadlineId, setEditingDeadlineId] = useState<number | null>(
    null
  );
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleUpdateDeadline = async (
    hoefAssignmentId: number,
    deadline: dayjs.ConfigType | null
  ) => {
    setEditingDeadlineId(null);
    const result = await updateHoefDeadline(
      hoefAssignmentId,
      deadline ? dayjs(deadline).toISOString() : null
    );
    if (result.success) {
      notification.success({
        message: "הדדליין עודכן",
        description: result.message,
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      });
    } else {
      message.error(result.message);
    }
  };

  const handleRemoveTask = async (task: HoefTaskItem) => {
    setRemovingId(task.task_assignment_id);
    const result = await removeTaskFromHoef(
      {
        task_assignment_id: task.task_assignment_id,
        task_name: task.task_name,
      },
      { hoef_member_id: hoef.hoef_member_id, name: hoef.name }
    );
    setRemovingId(null);
    if (result.success) {
      notification.success({
        message: "המשימה הוסרה",
        description: result.message,
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      });
    } else {
      message.error(result.message);
    }
  };

  const getStatusTag = (status: string, days?: number | null) => {
    const configs = {
      overdue: {
        color: "error",
        className: styles.statusTagOverdue,
        icon: <WarningOutlined />,
        text: days ? `${days} ימים` : "באיחור",
      },
      upcoming: {
        color: "warning",
        className: styles.statusTagUpcoming,
        icon: <ClockCircleOutlined />,
        text: days ? `${days} ימים` : "מתקרב",
      },
      ok: {
        color: "success",
        className: styles.statusTagOk,
        icon: <CheckCircleOutlined />,
        text: days ? `${days} ימים` : "תקין",
      },
      no_deadline: {
        color: "default",
        className: styles.statusTagNoDeadline,
        icon: null,
        text: "ללא דדליין",
      },
    };
    const config =
      configs[status as keyof typeof configs] || configs.no_deadline;
    return (
      <Tag
        color={config.color}
        icon={config.icon}
        className={`${styles.statusTag} ${config.className}`}
      >
        {config.text}
      </Tag>
    );
  };

  const getDeadlineDisplay = (task: HoefTaskItem) => {
    if (!task.deadline) {
      return null;
    }
    const deadlineDate = dayjs(task.deadline);
    const now = dayjs();
    const daysUntil = deadlineDate.diff(now, "day");
    let textClass = styles.deadlineTextOk;
    if (daysUntil < 0) {
      textClass = styles.deadlineTextOverdue;
    } else if (daysUntil <= 7) {
      textClass = styles.deadlineTextUpcoming;
    }
    return (
      <div className={styles.deadlineRow}>
        <CalendarOutlined className={styles.deadlineIcon} />
        <Text className={textClass}>
          {deadlineDate.format("DD/MM/YYYY HH:mm")}
        </Text>
      </div>
    );
  };

  return (
    <div className={styles.detailsContainer}>
      <Row gutter={12} className={styles.detailsStats}>
        <Col span={12}>
          <Card className={styles.detailStatCard}>
            <Statistic
              title="באיחור"
              value={hoef.stats.overdue}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card className={styles.detailStatCard}>
            <Statistic
              title="מתקרבים"
              value={hoef.stats.upcoming}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Card className={styles.detailProgress}>
        <div className={styles.progressLabel}>התקדמות כללית</div>
        <Progress
          percent={hoef.stats.completionRate}
          strokeColor="#52c41a"
          format={(percent) => `${percent}%`}
        />
      </Card>

      <div className={styles.tasksSection}>
        <Title level={5} className={styles.tasksSectionTitle}>
          משימות ({hoef.tasks.length})
        </Title>
        {hoef.tasks.length === 0 ? (
          <Empty description="אין משימות לחופף זה" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {hoef.tasks.map((task) => (
              <Card
                key={task.id}
                className={styles.taskDetailCard}
                actions={[
                  <Tooltip title="הסר מחופף זה" key="remove">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={removingId === task.task_assignment_id}
                      onClick={() => handleRemoveTask(task)}
                    />
                  </Tooltip>,
                ]}
              >
                <div className={styles.taskDetailHeader}>
                  <div className={styles.taskDetailInfo}>
                    <div
                      className={styles.taskDetailColor}
                      style={{ backgroundColor: task.task_color }}
                    />
                    <Text className={styles.taskDetailName}>
                      {task.task_name}
                    </Text>
                  </div>
                  {task.completed ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      הושלמה
                    </Tag>
                  ) : (
                    getStatusTag(task.status, task.daysUntilDeadline)
                  )}
                </div>

                {task.assignedTo?.user_name && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    שובץ ל: {task.assignedTo.user_name}
                  </Text>
                )}

                {!task.completed &&
                  (editingDeadlineId === task.id ? (
                    <div className={styles.deadlinePicker}>
                      <span className={styles.deadlinePickerLabel}>
                        קבע דדליין:
                      </span>
                      <div className={styles.deadlinePickerRow}>
                        <DatePicker
                          showTime
                          format="DD/MM/YYYY HH:mm"
                          placeholder="בחר תאריך ושעה"
                          onChange={(date) => {
                            if (date) {
                              handleUpdateDeadline(task.id!, date.toDate());
                            }
                          }}
                          onOpenChange={(open) => {
                            if (!open && editingDeadlineId === task.id) {
                              setEditingDeadlineId(null);
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="small"
                          type="text"
                          onClick={() => {
                            handleUpdateDeadline(task.id!, null);
                            setEditingDeadlineId(null);
                          }}
                        >
                          הסר
                        </Button>
                        <Button
                          size="small"
                          type="text"
                          onClick={() => setEditingDeadlineId(null)}
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {getDeadlineDisplay(task)}
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setEditingDeadlineId(task.id)}
                        style={{ padding: 0, height: "auto", marginTop: 4 }}
                      >
                        {task.deadline ? "ערוך דדליין" : "הוסף דדליין"}
                      </Button>
                    </>
                  ))}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HoefOverview: React.FC = () => {
  const [selectedHoefId, setSelectedHoefId] = useState<number | null>(null);
  const [filterKey, setFilterKey] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string[]>([
    "unassigned",
    "withFeedback",
  ]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | HoefTaskItem | null>(
    null
  );
  const [activeTaskType, setActiveTaskType] = useState<"task" | "hoef-task">(
    "task"
  );
  const [overHoefId, setOverHoefId] = useState<number | null>(null);

  const [selectedUserFilters, setSelectedUserFilters] = useState<number[]>([]);
  const [selectedAxisFilters, setSelectedAxisFilters] = useState<number[]>([]);
  const [selectedTaskGroupFilters, setSelectedTaskGroupFilters] = useState<
    number[]
  >([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>("week");
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);
  const [selectedHoefTaskModal, setSelectedHoefTaskModal] =
    useState<HoefTaskItem | null>(null);

  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [draggingMultipleTasks, setDraggingMultipleTasks] = useState<
    TaskItem[]
  >([]);

  const { selectedTeam } = useSelectionsStore();
  const {
    data: hoefsData,
    isLoading: hoefsLoading,
    error: hoefsError,
    refetch,
  } = useHoefTeamSummary(selectedTeam?.id);
  const {
    data: allTasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useTeamTasks(selectedTeam?.id);

  const poolTasks = useMemo((): TaskItem[] => {
    if (!allTasks) return [];
    return (allTasks as TaskItem[]).filter(
      (task: TaskItem) => !task.notRequiredToCheck
    );
  }, [allTasks]);

  const { assignTaskToHoef, removeTaskFromHoef, isAlreadyAssigned } =
    useDragAssignHoef();

  const isLoading = hoefsLoading || tasksLoading;

  // ✅ שימוש רק במשימות שלא אושרו (מסנן החוצה את כל ה"מאושרות" – task_completed)
  const poolAllTasks = useMemo(() => {
    return (allTasks || []).filter((t: TaskItem) => !t.task_completed);
  }, [allTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getSelectedTasksFromPool = useCallback((): TaskItem[] => {
    if (selectedTaskIds.length === 0) return [];
    return (poolAllTasks || []).filter((task: TaskItem) =>
      selectedTaskIds.includes(`task-${task.id}`)
    );
  }, [poolAllTasks, selectedTaskIds]);

  const filteredTasks = useMemo((): TaskItem[] => {
    if (!poolAllTasks) return [];
    let filtered = poolAllTasks;

    if (taskFilter.includes("approved")) {
      return filtered.filter((t: TaskItem) => !!t.task_completed);
    }

    if (taskFilter.includes("allTasks") || taskFilter.length === 0) {
      filtered = filtered.filter((t: TaskItem) => !t.task_completed);
    } else {
      filtered = filtered.filter((t: TaskItem) => {
        let matches = true;
        matches = matches && !t.task_completed;

        if (taskFilter.includes("missionsWithTime")) {
          matches = matches && t.taskRecommendedTime !== null;
        }
        if (taskFilter.includes("unassigned")) {
          matches = matches && !t.has_hoefs;
        }
        if (taskFilter.includes("assigned")) {
          matches = matches && t.has_hoefs;
        }
        if (taskFilter.includes("executed")) {
          matches = matches && !!t.task_completed_at && !t.task_completed;
        }
        if (taskFilter.includes("notExecuted")) {
          matches = matches && !t.task_completed_at;
        }
        if (taskFilter.includes("withFeedback")) {
          matches =
            matches &&
            t.task_feedback !== null &&
            t.task_feedback !== undefined;
        }
        return matches;
      });
    }

    if (selectedAxisFilters.length > 0) {
      filtered = filtered.filter((t: any) =>
        selectedAxisFilters.includes(t.axis?.id)
      );
    }

    if (selectedTaskGroupFilters.length > 0) {
      filtered = filtered.filter((t: any) =>
        selectedTaskGroupFilters.includes(t.taskGroup?.id)
      );
    }

    if (selectedUserFilters.length > 0) {
      filtered = filtered.filter(
        (t: TaskItem) =>
          t.assignedTo?.user_id != null &&
          selectedUserFilters.includes(t.assignedTo.user_id)
      );
    }

    if (selectedTimeFilter && selectedTimeFilter !== "all") {
      const now = dayjs();
      filtered = filtered.filter((t: TaskItem) => {
        if (!t.task_start) return false;
        const start = dayjs(t.task_start);
        if (selectedTimeFilter === "today") return start.isSame(now, "day");
        if (selectedTimeFilter === "week") return start.isSame(now, "week");
        if (selectedTimeFilter === "future") return start.isAfter(now);
        return true;
      });
    }

    return filtered;
  }, [
    poolAllTasks,
    taskFilter,
    selectedUserFilters,
    selectedAxisFilters,
    selectedTaskGroupFilters,
    selectedTimeFilter,
  ]);

  const taskCounts = useMemo(() => {
    if (!poolAllTasks)
      return {
        all: 0,
        missionsWithTime: 0,
        unassigned: 0,
        assigned: 0,
        executed: 0,
        notExecuted: 0,
        withFeedback: 0,
        userFiltered: 0,
      };

    const nonApprovedTasks = poolTasks.filter(
      (t: TaskItem) => !t.task_completed
    );

    const baseCounts = {
      all: poolAllTasks.length,
      missionsWithTime: poolAllTasks.filter(
        (t: TaskItem) => t.taskRecommendedTime !== null
      ).length,
      unassigned: poolAllTasks.filter((t: TaskItem) => !t.has_hoefs).length,
      assigned: poolAllTasks.filter((t: TaskItem) => t.has_hoefs).length,
      executed: poolAllTasks.filter(
        (t: TaskItem) => !!t.task_completed_at && !t.task_completed
      ).length,
      notExecuted: poolAllTasks.filter(
        (t: TaskItem) => !t.task_completed_at && !t.task_completed
      ).length,
      withFeedback: poolAllTasks.filter(
        (t: TaskItem) =>
          t.task_feedback !== null && t.task_feedback !== undefined
      ).length,
    };

    if (selectedUserFilters.length > 0) {
      const userFilteredTasks = poolAllTasks.filter(
        (t: TaskItem) =>
          t.assignedTo?.user_id != null &&
          selectedUserFilters.includes(t.assignedTo.user_id)
      );
      return { ...baseCounts, userFiltered: userFilteredTasks.length };
    }
    return { ...baseCounts, userFiltered: poolAllTasks.length };
  }, [poolAllTasks, selectedUserFilters]);

  const availableUsers = useMemo(() => {
    if (!poolAllTasks) return [];
    const usersMap = new Map<number, { id: number; name: string }>();
    poolAllTasks.forEach((t: any) => {
      if (t.assignedTo?.user_id && t.assignedTo?.user_name) {
        usersMap.set(t.assignedTo.user_id, {
          id: t.assignedTo.user_id,
          name: t.assignedTo.user_name,
        });
      }
    });
    return Array.from(usersMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "he")
    );
  }, [poolAllTasks]);


  const visibleHoefs = useMemo((): HoefData[] => {
    if (!hoefsData) return [];

    const recomputeStats = (tasks: HoefTaskItem[]) => {
      const total = tasks.length;
      const overdue = tasks.filter((t) => t.status === "overdue").length;
      const upcoming = tasks.filter((t) => t.status === "upcoming").length;
      const noDeadline = tasks.filter(
        (t) => !t.completed && t.status !== "overdue" && t.status !== "upcoming"
      ).length;
      const completed = tasks.filter((t) => t.completed).length;
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, overdue, upcoming, noDeadline, completed, completionRate };
    };

    return hoefsData.map((member: HoefData) => {
      const tasks = (member.tasks || []).filter(
        (t: HoefTaskItem) => !t.notRequiredToCheck
      );
      return { ...member, tasks, stats: recomputeStats(tasks) };
    });
  }, [hoefsData]);

  const totalStats = useMemo(() => {
    if (!visibleHoefs) {
      return {
        total: 0,
        overdue: 0,
        upcoming: 0,
        completed: 0,
        noDeadline: 0,
        hoefCount: 0,
        mifatzCount: 0,
      };
    }
    return visibleHoefs.reduce(
      (acc: any, member: HoefData) => ({
        total: acc.total + member.stats.total,
        overdue: acc.overdue + member.stats.overdue,
        upcoming: acc.upcoming + member.stats.upcoming,
        completed: acc.completed + member.stats.completed,
        noDeadline: acc.noDeadline + member.stats.noDeadline,
        hoefCount: acc.hoefCount + (member.member_role === "OVERLAP" ? 1 : 0),
        mifatzCount:
          acc.mifatzCount + (member.member_role === "TEAM_COMMANDER" ? 1 : 0),
      }),
      {
        total: 0,
        overdue: 0,
        upcoming: 0,
        completed: 0,
        noDeadline: 0,
        hoefCount: 0,
        mifatzCount: 0,
      }
    );
  }, [visibleHoefs]);

  const filteredHoefs = useMemo((): HoefData[] => {
    if (!visibleHoefs) return [];
    switch (filterKey) {
      case "overdue":
        return visibleHoefs.filter((h: HoefData) => h.stats.overdue > 0);
      case "upcoming":
        return visibleHoefs.filter((h: HoefData) => h.stats.upcoming > 0);
      case "noDeadline":
        return visibleHoefs.filter((h: HoefData) => h.stats.noDeadline > 0);
      default:
        return visibleHoefs;
    }
  }, [visibleHoefs, filterKey]);

  const availableAxes = useMemo(() => {
    if (!poolAllTasks) return [];
    const axesMap = new Map<
      number,
      { id: number; name: string; color: string }
    >();
    poolAllTasks.forEach((t: any) => {
      if (t.axis?.id && t.axis?.name) {
        axesMap.set(t.axis.id, {
          id: t.axis.id,
          name: t.axis.name,
          color: t.axis.color,
        });
      }
    });
    return Array.from(axesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "he")
    );
  }, [poolAllTasks]);

  const availableTaskGroups = useMemo(() => {
    if (!poolAllTasks) return [];

    let filteredTasks = poolAllTasks;
    if (selectedAxisFilters.length > 0) {
      filteredTasks = poolAllTasks.filter((t: any) =>
        selectedAxisFilters.includes(t.axis?.id)
      );
    }

    const groupsMap = new Map<number, { id: number; name: string }>();
    filteredTasks.forEach((t: any) => {
      if (t.taskGroup?.id && t.taskGroup?.name) {
        groupsMap.set(t.taskGroup.id, {
          id: t.taskGroup.id,
          name: t.taskGroup.name,
        });
      }
    });
    return Array.from(groupsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "he")
    );
  }, [poolAllTasks, selectedAxisFilters]);

  const selectedHoef = useMemo((): HoefData | null => {
    if (!selectedHoefId || !visibleHoefs) return null;
    return (
      visibleHoefs.find((h: HoefData) => h.hoef_member_id === selectedHoefId) ||
      null
    );
  }, [selectedHoefId, visibleHoefs]);

  const handleOpenTaskModal = (task: TaskItem) => {
    setSelectedTaskForModal(task);
  };

  const handleCloseTaskModal = () => {
    setSelectedTaskForModal(null);
  };

  const handleSelectHoef = (hoefMemberId: number) => {
    setSelectedHoefId(hoefMemberId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedHoefId(null);
  };

  const handleOpenHoefTaskModal = (task: HoefTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();

    const taskForModal = {
      id: typeof task.id === "number" ? task.id : 0,
      task_id: task.task_id,
      task_assignment_id: task.task_assignment_id,
      task_name: task.task_name,
      task_color: task.task_color,
      task_start: task.deadline ?? null,
      task_end: null,
      task_completed: task.completed ?? false,
      task_completed_at: task.completed_at ?? null,
      task_feedback: (task as any).task_feedback ?? null,
      hoef_count:
        typeof task.hoef_count === "number"
          ? task.hoef_count
          : typeof task.hoef_count === "string"
            ? parseInt(String(task.hoef_count)) || 0
            : 0,
      has_hoefs:
        (typeof task.hoef_count === "number"
          ? task.hoef_count
          : typeof task.hoef_count === "string"
            ? parseInt(String(task.hoef_count)) || 0
            : 0) > 0,
      hoefs: (task as any).hoefs ?? [],
      taskGroup: (task as any).taskGroup,
      axis: (task as any).axis,
      assignedTo: task.assignedTo,
      taskRecommendedTime: (task as any).taskRecommendedTime,
      feedback: (task as any).feedback ?? null,
      notRequiredToCheck: (task as any).notRequiredToCheck,
      formId: (task as any).formId ?? null,
      form_score: (task as any).form_score ?? null,
      form_completed_at: (task as any).form_completed_at ?? null,
      form_started_at: (task as any).form_started_at ?? null,
      max_score: (task as any).max_score ?? null,
      scorePercentage: (task as any).scorePercentage ?? null,
    } as TaskItem;

    setSelectedTaskForModal(taskForModal);
  };

  const handleCloseHoefTaskModal = () => {
    setSelectedHoefTaskModal(null);
    refetch();
    refetchTasks();
  };

  const collisionDetection = (args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (!active.data.current) {
      return;
    }

    const data = active.data.current;
    const taskType = data.type as "task" | "hoef-task";

    const selectedTasks = getSelectedTasksFromPool();
    const hasSelectedTasks = selectedTasks.length > 0;

    if (taskType === "hoef-task") {
      const task = data.task as HoefTaskItem;
      if (task) {
        setActiveTask(task);
        setActiveTaskType("hoef-task");
        setDraggingMultipleTasks([]);
      }
    } else {
      const task = data.task as TaskItem;
      if (task) {
        setActiveTask(task);
        setActiveTaskType("task");

        if (hasSelectedTasks) {
          setDraggingMultipleTasks(selectedTasks);
        } else {
          setDraggingMultipleTasks([]);
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (over?.data.current?.type === "member") {
      const member = over.data.current.member as HoefData;
      setOverHoefId(member.hoef_member_id);
    } else {
      setOverHoefId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverHoefId(null);

    const tasksToAssign = [...draggingMultipleTasks];
    setDraggingMultipleTasks([]);

    if (!over || !over.data.current || !active.data.current) {
      return;
    }

    if (over.data.current.type !== "member") {
      return;
    }

    const member = over.data.current.member as HoefData;
    const activeData = active.data.current;
    const taskType = activeData.type as "task" | "hoef-task";

    const roleText = member.member_role === "TEAM_COMMANDER" ? 'מפ"צ' : "חופף";

    if (tasksToAssign.length > 0) {
      let successCount = 0;
      let failCount = 0;

      for (const task of tasksToAssign) {
        if (isAlreadyAssigned(member.tasks, task.task_assignment_id)) {
          failCount++;
          continue;
        }

        const result = await assignTaskToHoef(
          {
            task_assignment_id: task.task_assignment_id,
            task_name: task.task_name,
          },
          {
            id: member.hoef_member_id,
            team_member_id: member.hoef_member_id,
            name: member.name,
          }
        );

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        queryClient.refetchQueries({
          queryKey: ["tasks-range"],
        });
        notification.success({
          message: `הועברו ${successCount} משימות בהצלחה`,
          description: `${successCount} משימות הוספו ל${roleText} ${member.name
            }${failCount > 0 ? `, ${failCount} לא הועברו (כבר משויכות)` : ""}`,
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          placement: "topRight",
        });
      } else if (failCount > 0) {
        message.warning(`${failCount} משימות כבר משויכות לאיש הזה`);
      }

      setSelectedTaskIds([]);
      setMultiSelectMode(false);
      refetch();
      refetchTasks();
    } else if (taskType === "hoef-task") {
      const hoefTask = activeData.task as HoefTaskItem;
      const sourceMemberId = activeData.sourceMemberId as number;

      if (!hoefTask || sourceMemberId === undefined) {
        return;
      }

      if (sourceMemberId === member.hoef_member_id) {
        return;
      }

      const sourceMember = hoefsData?.find(
        (h: HoefData) => h.hoef_member_id === sourceMemberId
      );

      const removeResult = await removeTaskFromHoef(
        {
          task_assignment_id: hoefTask.task_assignment_id,
          task_name: hoefTask.task_name,
        },
        {
          hoef_member_id: sourceMemberId,
          name: sourceMember?.name || "",
        }
      );

      if (!removeResult.success) {
        message.error(removeResult.message);
        return;
      }

      const addResult = await assignTaskToHoef(
        {
          task_assignment_id: hoefTask.task_assignment_id,
          task_name: hoefTask.task_name,
        },
        {
          id: member.hoef_member_id,
          team_member_id: member.hoef_member_id,
          name: member.name,
        }
      );

      if (addResult.success) {
        queryClient.refetchQueries({
          queryKey: ["tasks-range"],
        });
        notification.success({
          message: "המשימה הועברה בהצלחה",
          description: `המשימה ${hoefTask.task_name} הועברה ל${roleText} ${member.name}`,
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          placement: "topRight",
        });
        refetch();
        refetchTasks();
      } else {
        message.error(addResult.message);
      }
    } else {
      const task = activeData.task as TaskItem;

      if (!task) return;

      if (isAlreadyAssigned(member.tasks, task.task_assignment_id)) {
        message.warning("משימה זו כבר משויכת לאיש הזה");
        return;
      }

      const result = await assignTaskToHoef(
        {
          task_assignment_id: task.task_assignment_id,
          task_name: task.task_name,
        },
        {
          id: member.hoef_member_id,
          team_member_id: member.hoef_member_id,
          name: member.name,
        }
      );

      if (result.success) {
        queryClient.refetchQueries({
          queryKey: ["tasks-range"],
        });
        notification.success({
          message: "המשימה הועברה בהצלחה",
          description: `המשימה ${task.task_name} הוספה ל${roleText} ${member.name}`,
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          placement: "topRight",
        });
        refetch();
        refetchTasks();
      } else {
        message.error(result.message);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverHoefId(null);
    setDraggingMultipleTasks([]);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Text>טוען נתונים...</Text>
      </div>
    );
  }

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

  return (
    <>
      <div style={{ direction: "rtl" }}>
        <HeaderPermissionDisplay />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className={styles.container}>
          <div className={styles.flexRow}>
            <div className={styles.taskPoolWrapper}>
              <HoefTaskPool
                allTasks={poolAllTasks}
                taskFilter={taskFilter}
                setTaskFilter={setTaskFilter}
                selectedUserFilters={selectedUserFilters}
                setSelectedUserFilters={setSelectedUserFilters}
                filteredTasks={filteredTasks}
                taskCounts={taskCounts}
                availableUsers={availableUsers}
                onTaskClick={handleOpenTaskModal}
                availableTaskGroups={availableTaskGroups}
                selectedAxisFilters={selectedAxisFilters}
                setSelectedAxisFilters={setSelectedAxisFilters}
                selectedTaskGroupFilters={selectedTaskGroupFilters}
                setSelectedTaskGroupFilters={setSelectedTaskGroupFilters}
                availableAxes={availableAxes}
                multiSelectMode={multiSelectMode}
                setMultiSelectMode={setMultiSelectMode}
                selectedTaskIds={selectedTaskIds}
                setSelectedTaskIds={setSelectedTaskIds}
                selectedTimeFilter={selectedTimeFilter}
                setSelectedTimeFilter={setSelectedTimeFilter}
              />
            </div>

            <div className={styles.overviewWrapper}>
              <Card className={styles.mainCard} bordered={false}>
                <div className={styles.header}>
                  <div>
                    <Title level={3} className={styles.title}>
                      סקירת חופפים ומפ"צים
                    </Title>
                    <Text type="secondary">
                      גרור משימות לכרטיסי החופפים או המפ"צים כדי ליצור שיוך
                    </Text>
                  </div>
                  <div className={styles.countBadges}>
                    <Tag className={styles.hoefCountTag}>
                      {totalStats.hoefCount}{" "}
                      {totalStats.hoefCount === 1 ? "חופף" : "חופפים"}
                    </Tag>
                    <Tag className={styles.hoefCountTag}>
                      {totalStats.mifatzCount}{" "}
                      {totalStats.mifatzCount === 1 ? 'מפ"צ' : 'מפ"צים'}
                    </Tag>
                  </div>
                </div>

                <Row gutter={16} className={styles.statsRow}>
                  <Col xs={12} sm={6}>
                    <Card className={`${styles.statCard} ${styles.totalCard}`}>
                      <Statistic title="סה״כ משימות" value={totalStats.total} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card
                      className={`${styles.statCard} ${styles.overdueCard}`}
                    >
                      <Statistic title="באיחור" value={totalStats.overdue} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card
                      className={`${styles.statCard} ${styles.upcomingCard}`}
                    >
                      <Statistic title="מתקרבים" value={totalStats.upcoming} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card
                      className={`${styles.statCard} ${styles.completedCard}`}
                    >
                      <Statistic title="הושלמו" value={totalStats.completed} />
                    </Card>
                  </Col>
                </Row>

                <Tabs
                  activeKey={filterKey}
                  onChange={setFilterKey}
                  className={styles.tabs}
                  items={[
                    {
                      key: "all",
                      label: <span>הכל ({visibleHoefs?.length || 0})</span>,
                    },
                    {
                      key: "overdue",
                      label: (
                        <span>
                          באיחור{" "}
                          <span
                            className={
                              totalStats.overdue > 0
                                ? styles.tabCountRed
                                : styles.tabCountGray
                            }
                          >
                            ({totalStats.overdue})
                          </span>
                        </span>
                      ),
                    },
                    {
                      key: "upcoming",
                      label: <span>מתקרבים ({totalStats.upcoming})</span>,
                    },
                    {
                      key: "noDeadline",
                      label: <span>ללא דדליין ({totalStats.noDeadline})</span>,
                    },
                  ]}
                />

                <div className={styles.hoefsGrid}>
                  <Row gutter={[16, 16]}>
                    {!visibleHoefs || visibleHoefs.length === 0 ? (
                      <Col span={24}>
                        <Empty
                          description="אין חופפים בצוות"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      </Col>
                    ) : filteredHoefs.length === 0 ? (
                      <Col span={24}>
                        <Empty description="לא נמצאו חופפים עם הסינון הנבחר" />
                      </Col>
                    ) : (
                      filteredHoefs.map((member: HoefData) => (
                        <Col xs={24} sm={12} lg={6} key={member.hoef_member_id}>
                          <DroppableCard
                            member={member}
                            isOver={overHoefId === member.hoef_member_id}
                            onSelect={() =>
                              handleSelectHoef(member.hoef_member_id)
                            }
                            onOpenTaskModal={handleOpenHoefTaskModal}
                            onRefetch={refetch}
                          />
                        </Col>
                      ))
                    )}
                  </Row>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <DragOverlayTask task={activeTask} type={activeTaskType} />
          ) : null}
        </DragOverlay>

        <Drawer
          title={
            <div className={styles.drawerTitle}>
              <Avatar
                size="large"
                icon={<UserOutlined />}
                className={styles.drawerAvatar}
              />
              <span>{selectedHoef?.name}</span>
            </div>
          }
          placement="right"
          width={500}
          onClose={handleCloseDrawer}
          open={drawerOpen}
          closeIcon={<CloseOutlined />}
          className={styles.drawer}
        >
          {selectedHoef && <HoefDetails hoef={selectedHoef} />}
        </Drawer>

        {selectedTaskForModal && (
          <UserTaskModal
            taskId={Number(selectedTaskForModal.task_id)}
            task={selectedTaskForModal}
            openModal={!!selectedTaskForModal}
            setOpenModal={setSelectedTaskForModal}
            setSelectedEvent={setSelectedTaskForModal}
            completed_at={selectedTaskForModal.task_completed_at}
            onRefresh={() => {
              refetch();
              refetchTasks();
            }}
          />
        )}

        {/*  {selectedHoefTaskModal && (
          <UserTaskModal
            taskGroupName="hoef"
            taskId={Number(selectedHoefTaskModal.task_id)}
            task={selectedHoefTaskModal}
            openModal={!!selectedHoefTaskModal}
            setOpenModal={handleCloseHoefTaskModal}
            setSelectedEvent={setSelectedHoefTaskModal}
            completed_at={selectedHoefTaskModal.completed}
          />
        )} */}

      </DndContext>
    </>
  );
};

export default HoefOverview;
