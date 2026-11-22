"use client";
import React, { useMemo, useState } from "react";
import {
  Card,
  Tag,
  Empty,
  Typography,
  Button,
  Tooltip,
  Select,
  Input,
  Popover,
} from "antd";
import {
  CalendarOutlined,
  DownOutlined,
  CheckOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useDraggable } from "@dnd-kit/core";
import { TaskItem } from "../../types/types";
import dayjs from "dayjs";
import "dayjs/locale/he";
import styles from "./HoefTaskPool.module.css";
import TaskUserTag from "../../components/Task/TaskTag/TaskUserTag";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

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
    }
    return classes.filter(Boolean).join(" ");
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  const getHoefBadgeInfo = () => {
    if (task.hoef_count === 0) {
      return { text: "ללא חופפים", className: styles.noHoefs };
    } else if (task.hoef_count === 1) {
      return { text: "1 חופף", className: styles.hasHoefs };
    } else {
      return { text: `${task.hoef_count} חופפים`, className: styles.hasHoefs };
    }
  };

  const hoefBadgeInfo = getHoefBadgeInfo();
  const hasFeedback = task.task_feedback;

  const FeedbackStatusTag = ({ task }: { task: any }) => {
    const { has_feedback, feedback_answered } = task?.feedback;
    const feedback = task?.feedback;
    const task_completed = task?.task_completed;

    if (!has_feedback) {
      return null;
    }

    const tooltipStyles = {
      tooltipWrapper: {
        direction: "rtl" as const,
        textAlign: "right" as const,
        minWidth: 150,
      },
      tooltipTitle: {
        fontWeight: 600,
        marginBottom: 8,
      },
      tag: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontWeight: 500,
        cursor: "pointer" as const,
        padding: "2px 8px",
        borderRadius: 4,
      },
    };

    const tooltipContent = (
      <div style={tooltipStyles.tooltipWrapper}>
        <div style={tooltipStyles.tooltipTitle}>
          {feedback_answered ? "✅ משוב ניתן" : "⏳ משוב טרם ניתן"}
        </div>

        {feedback_answered && feedback.text_comment && (
          <div style={{ marginBottom: 4 }}>💬 {feedback.text_comment}</div>
        )}

        {feedback_answered && feedback.summary_grade != null && (
          <div style={{ marginBottom: 4 }}>
            📊 ציון: {feedback.summary_grade}
          </div>
        )}

        {feedback_answered && feedback.selectedOptionLabel && (
          <div>🏷️ {feedback.selectedOptionLabel}</div>
        )}

        {!feedback_answered && task_completed && (
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
            ממתין לתגובת המורה
          </div>
        )}

        {!task_completed && (
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
            יש להשלים את המשימה תחילה
          </div>
        )}
      </div>
    );

    const tagColor = feedback_answered
      ? "success"
      : task_completed
      ? "warning"
      : "default";
    const icon = feedback_answered ? (
      <CheckCircleOutlined />
    ) : task_completed ? (
      <ClockCircleOutlined />
    ) : (
      <CloseCircleOutlined />
    );

    const label = feedback_answered
      ? "נענה"
      : task_completed
      ? "ממתין למשוב"
      : "ללא משוב";

    return (
      <Tooltip title={tooltipContent} placement="top">
        <Tag icon={icon} color={tagColor} style={tooltipStyles.tag}>
          {label}
        </Tag>
      </Tooltip>
    );
  };

  const getHoefNames = (): string => {
    if (!task.hoefs || task.hoefs.length === 0) {
      return "ללא חופפים משובצים";
    }
    const names = task.hoefs.map((hoef) => hoef.user_name).filter(Boolean);
    if (names.length === 0) {
      return "ללא חופפים משובצים";
    }
    return names.join(", ");
  };

  const formatAssignmentDate = (dateString: string | null): string => {
    if (!dateString) return "";
    try {
      const date = dayjs(new Date(dateString));
      if (!date.isValid()) return ""; // date-fns threw here, which returned ""
      return date.locale("he").format("[יום ]dddd, DD/MM/YYYY, HH:mm");
    } catch {
      return "";
    }
  };

  const taskStatusObject = {
    id: task.id,
    task_assignment_id: task.task_assignment_id,
    name: task.assignedTo?.user_name || task.task_name,
    completed:
      task.task_completed && task.task_completed_at
        ? new Date(task.task_completed_at)
        : null,
    completed_at: task.task_completed_at
      ? new Date(task.task_completed_at)
      : null,
    assigned: task.task_start ? new Date(task.task_start) : null,
  };

  return (
    <div
      ref={setNodeRef}
      className={getItemClasses()}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className={styles.rightColorBar}
        style={{ backgroundColor: task.task_color }}
      />

      <div className={styles.taskItemContent}>
        <div className={styles.taskInfo}>
          <div className={styles.taskNameRow}>
            <Text className={styles.taskName}>{task.task_name}</Text>
            {hasFeedback && <FeedbackStatusTag task={task} />}
          </div>

          <div className={styles.processTagRow}>
            <div className={styles.taskUserTagWrapper}>
              <TaskUserTag task={taskStatusObject} size={true} />
            </div>
          </div>

          <div className={styles.assignmentRow}>
            <span className={styles.assignedTo}>
              {task.assignedTo?.user_name || "לא שובץ"}
            </span>
          </div>
        </div>

        <div className={styles.leftSection}>
          <Tooltip title={getHoefNames()} placement="top" mouseEnterDelay={0.3}>
            <Tag className={`${styles.hoefBadge} ${hoefBadgeInfo.className}`}>
              {hoefBadgeInfo.text}
            </Tag>
          </Tooltip>

          {task.task_start && (
            <div className={styles.dateCompact}>
              <CalendarOutlined className={styles.dateIcon} />
              <span>{formatAssignmentDate(task.task_start)}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.openTaskWrapper}>
        <Button
          type="text"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onTaskClick?.(task);
          }}
          className={styles.openTaskLink}
        >
          פתח משימה
          <span style={{ color: "#000000", fontSize: "14px" }}>👁</span>
        </Button>
      </div>
    </div>
  );
};

interface HoefTaskPoolProps {
  allTasks: TaskItem[] | undefined;
  taskFilter: string[];
  setTaskFilter: React.Dispatch<React.SetStateAction<string[]>>;
  selectedUserFilters: number[];
  setSelectedUserFilters: React.Dispatch<React.SetStateAction<number[]>>;
  filteredTasks: TaskItem[];
  taskCounts: {
    all: number;
    missionsWithTime: number;
    unassigned: number;
    assigned: number;
    executed: number;
    notExecuted: number;
    withFeedback: number;
    userFiltered: number;
  };
  availableUsers: Array<{ id: number; name: string }>;
  onTaskClick: (task: TaskItem) => void;
  availableTaskGroups: any;
  selectedAxisFilters: number[];
  setSelectedAxisFilters: React.Dispatch<React.SetStateAction<number[]>>;
  selectedTaskGroupFilters: number[];
  setSelectedTaskGroupFilters: React.Dispatch<React.SetStateAction<number[]>>;
  availableAxes: any;
  multiSelectMode: boolean;
  setMultiSelectMode: (value: boolean) => void;
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTimeFilter: string;
  setSelectedTimeFilter: React.Dispatch<React.SetStateAction<string>>;
}

const MUTUALLY_EXCLUSIVE_PAIRS: [string, string][] = [
  ["assigned", "unassigned"],
  ["executed", "notExecuted"],
];

const TIME_FILTER_OPTIONS = [
  { value: "all", label: "כל הזמנים" },
  { value: "today", label: "היום" },
  { value: "week", label: "השבוע" },
  { value: "future", label: "עתידיות" },
];

const HoefTaskPool: React.FC<HoefTaskPoolProps> = ({
  taskFilter,
  setTaskFilter,
  selectedUserFilters,
  setSelectedUserFilters,
  filteredTasks,
  taskCounts,
  availableUsers,
  onTaskClick,
  availableTaskGroups,
  selectedAxisFilters,
  setSelectedAxisFilters,
  selectedTaskGroupFilters,
  setSelectedTaskGroupFilters,
  availableAxes,
  multiSelectMode,
  setMultiSelectMode,
  selectedTaskIds,
  setSelectedTaskIds,
  selectedTimeFilter,
  setSelectedTimeFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [draftTaskFilter, setDraftTaskFilter] = useState<string[]>([]);
  const [draftSelectedUserFilters, setDraftSelectedUserFilters] = useState<
    number[]
  >([]);
  const [draftSelectedAxisFilters, setDraftSelectedAxisFilters] = useState<
    number[]
  >([]);
  const [draftSelectedTaskGroupFilters, setDraftSelectedTaskGroupFilters] =
    useState<number[]>([]);
  const [draftTimeFilter, setDraftTimeFilter] = useState<string>("all");

  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (open) {
      setDraftTaskFilter(taskFilter);
      setDraftSelectedUserFilters(selectedUserFilters);
      setDraftSelectedAxisFilters(selectedAxisFilters);
      setDraftSelectedTaskGroupFilters(selectedTaskGroupFilters);
      setDraftTimeFilter(selectedTimeFilter);
    }
  };

  const isDraftFilterActive = (filterKey: string): boolean => {
    if (filterKey === "allTasks") {
      return (
        draftTaskFilter.includes("allTasks") || draftTaskFilter.length === 0
      );
    }
    return draftTaskFilter.includes(filterKey);
  };

  const toggleDraftFilter = (filter: string): void => {
    setDraftTaskFilter((prev) => {
      if (filter === "allTasks") {
        return ["allTasks"];
      }
      const withoutAllTasks = prev.includes("allTasks")
        ? prev.filter((f) => f !== "allTasks")
        : [...prev];

      const pair = MUTUALLY_EXCLUSIVE_PAIRS.find(
        ([a, b]) => a === filter || b === filter
      );
      const isAlreadyActive = withoutAllTasks.includes(filter);

      if (pair) {
        const withoutPair = withoutAllTasks.filter((f) => !pair.includes(f));
        if (isAlreadyActive) return withoutPair;
        return [...withoutPair, filter];
      }

      if (withoutAllTasks.includes(filter)) {
        if (withoutAllTasks.length === 1) return prev;
        return withoutAllTasks.filter((f) => f !== filter);
      }
      return [...withoutAllTasks, filter];
    });
  };

  const handleDraftUserFilterChange = (value: number[]) => {
    if (value.includes(-1)) setDraftSelectedUserFilters([]);
    else setDraftSelectedUserFilters(value);
  };

  const handleDraftAxisFilterChange = (value: number[]) => {
    if (value.includes(-1)) setDraftSelectedAxisFilters([]);
    else setDraftSelectedAxisFilters(value);
  };

  const handleDraftGroupFilterChange = (value: number[]) => {
    if (value.includes(-1)) setDraftSelectedTaskGroupFilters([]);
    else setDraftSelectedTaskGroupFilters(value);
  };

  const removeDraftUserFilter = (userId: number) => {
    setDraftSelectedUserFilters((prev) => prev.filter((id) => id !== userId));
  };

  const removeDraftAxisFilter = (axisId: number) => {
    setDraftSelectedAxisFilters((prev) => prev.filter((id) => id !== axisId));
  };

  const removeDraftGroupFilter = (groupId: number) => {
    setDraftSelectedTaskGroupFilters((prev) =>
      prev.filter((id) => id !== groupId)
    );
  };

  const applyFilters = () => {
    setTaskFilter(draftTaskFilter);
    setSelectedUserFilters(draftSelectedUserFilters);
    setSelectedAxisFilters(draftSelectedAxisFilters);
    setSelectedTaskGroupFilters(draftSelectedTaskGroupFilters);
    setSelectedTimeFilter(draftTimeFilter);
    setPopoverOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === "") {
      setAppliedSearchTerm("");
    }
  };

  const handleSearchEnter = () => {
    setAppliedSearchTerm(searchTerm.trim().toLowerCase());
  };

  const sortedTasks = useMemo(() => {
    let tasks = filteredTasks;
    if (appliedSearchTerm) {
      tasks = tasks.filter((t) =>
        (t.task_name || "").toLowerCase().includes(appliedSearchTerm)
      );
    }
    return [...tasks].sort((a, b) => {
      const aSelected = selectedTaskIds.includes(`task-${a.id}`);
      const bSelected = selectedTaskIds.includes(`task-${b.id}`);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      if (!a.task_start && !b.task_start) return 0;
      if (!a.task_start) return 1;
      if (!b.task_start) return -1;
      return (
        new Date(b.task_start).getTime() - new Date(a.task_start).getTime()
      );
    });
  }, [filteredTasks, selectedTaskIds, appliedSearchTerm]);

  const allTaskIds = useMemo(() => {
    return filteredTasks.map((task) => `task-${task.id}`);
  }, [filteredTasks]);

  const allSelected = useMemo(() => {
    if (allTaskIds.length === 0) return false;
    return allTaskIds.every((id) => selectedTaskIds.includes(id));
  }, [allTaskIds, selectedTaskIds]);

  const handleSelectAllToggle = () => {
    if (allSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(allTaskIds);
    }
  };

  const handleCheckboxChange = (taskId: string, checked: boolean, e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();

    setSelectedTaskIds((prev) => {
      if (checked) {
        if (!prev.includes(taskId)) {
          return [...prev, taskId];
        }
        return prev;
      } else {
        return prev.filter((id) => id !== taskId);
      }
    });
  };

  const handleMultiSelectModeToggle = (checked: boolean) => {
    setMultiSelectMode(checked);
    if (!checked) {
      setSelectedTaskIds([]);
    }
  };

  const handleMultiSelectToggleClick = () => {
    handleMultiSelectModeToggle(!multiSelectMode);
  };

  const getUserName = (userId: number) => {
    const user = availableUsers.find((u) => u.id === userId);
    return user?.name || "";
  };

  const getAxisName = (axisId: number) => {
    const axis = availableAxes.find((a: any) => a.id === axisId);
    return axis?.name || "";
  };

  const getAxisColor = (axisId: number) => {
    const axis = availableAxes.find((a: any) => a.id === axisId);
    return axis?.color || "#000";
  };

  const getGroupName = (groupId: number) => {
    const group = availableTaskGroups.find((g: any) => g.id === groupId);
    return group?.name || "";
  };

  const renderPairButton = (
    filterKey: string,
    label: string,
    count: number
  ) => (
    <Button
      type={isDraftFilterActive(filterKey) ? "primary" : "default"}
      size="small"
      onClick={() => toggleDraftFilter(filterKey)}
      className={styles.filterPairButton}
    >
      {label}
      <span className={styles.filterCount}>({count})</span>
    </Button>
  );

  return (
    <Card
      className={styles.sidePanel}
      title={
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>מאגר משימות</span>

          <div className={styles.panelActionsRow}>
            <Popover
              trigger="click"
              placement="bottom"
              open={popoverOpen}
              onOpenChange={handlePopoverOpenChange}
              overlayClassName={styles.filterPopoverOverlay}
              content={
                <div className={styles.filterPopoverContent}>
                  <div className={styles.filterPopoverHeader}>פילטור מאגר</div>

                  <div className={styles.filterPairRow}>
                    {renderPairButton("allTasks", "כל המשימות", taskCounts.all)}
                    {renderPairButton(
                      "missionsWithTime",
                      "משימות להגשה",
                      taskCounts.missionsWithTime
                    )}
                  </div>

                  <div className={styles.filterPairRow}>
                    {renderPairButton(
                      "assigned",
                      "עם חופפים",
                      taskCounts.assigned
                    )}
                    {renderPairButton(
                      "unassigned",
                      "ללא חופפים",
                      taskCounts.unassigned
                    )}
                  </div>

                  <div className={styles.filterPairRow}>
                    {renderPairButton("executed", "בוצעו", taskCounts.executed)}
                    {renderPairButton(
                      "notExecuted",
                      "לא בוצע",
                      taskCounts.notExecuted
                    )}
                  </div>

                  <div className={styles.filterSingleRow}>
                    {renderPairButton(
                      "withFeedback",
                      "עם משוב",
                      taskCounts.withFeedback
                    )}
                  </div>

                  <div className={styles.filterSelectLine}>
                    <Select
                      placeholder="כל הנחפפים"
                      size="small"
                      mode="multiple"
                      value={draftSelectedUserFilters}
                      onChange={handleDraftUserFilterChange}
                      className={styles.filterSelect}
                      suffixIcon={
                        <DownOutlined
                          style={{ color: "#000000", fontSize: "10px" }}
                        />
                      }
                      popupMatchSelectWidth={false}
                      style={{ width: "100%" }}
                      maxTagCount={0}
                      showSearch={false}
                      getPopupContainer={(trigger: any) =>
                        trigger.parentElement
                      }
                      maxTagPlaceholder={(omittedVals) =>
                        `${omittedVals.length}+`
                      }
                      options={[
                        { value: -1, label: "כל הנחפפים" },
                        ...availableUsers.map((user) => ({
                          value: user.id,
                          label: user.name,
                        })),
                      ]}
                    />
                    {draftSelectedUserFilters.length > 0 && (
                      <div className={styles.selectedTagsContainer}>
                        {draftSelectedUserFilters.map((userId) => (
                          <Tag
                            key={userId}
                            className={styles.selectedTag}
                            closable
                            onClose={(e) => {
                              e.preventDefault();
                              removeDraftUserFilter(userId);
                            }}
                          >
                            {getUserName(userId)}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>

                  {availableTaskGroups && availableTaskGroups.length > 0 && (
                    <div className={styles.filterSelectLine}>
                      <Select
                        placeholder="כל הקבוצות"
                        size="small"
                        mode="multiple"
                        value={draftSelectedTaskGroupFilters}
                        onChange={handleDraftGroupFilterChange}
                        className={styles.filterSelect}
                        suffixIcon={
                          <DownOutlined
                            style={{ color: "#000000", fontSize: "10px" }}
                          />
                        }
                        popupMatchSelectWidth={false}
                        style={{ width: "100%" }}
                        maxTagCount={0}
                        showSearch={false}
                        getPopupContainer={(trigger: any) =>
                          trigger.parentElement
                        }
                        maxTagPlaceholder={(omittedVals) =>
                          `${omittedVals.length}+`
                        }
                        options={[
                          { value: -1, label: "כל הקבוצות" },
                          ...availableTaskGroups.map((group: any) => ({
                            value: group.id,
                            label: group.name,
                          })),
                        ]}
                      />
                      {draftSelectedTaskGroupFilters.length > 0 && (
                        <div className={styles.selectedTagsContainer}>
                          {draftSelectedTaskGroupFilters.map((groupId) => (
                            <Tag
                              key={groupId}
                              className={styles.selectedTag}
                              closable
                              onClose={(e) => {
                                e.preventDefault();
                                removeDraftGroupFilter(groupId);
                              }}
                            >
                              {getGroupName(groupId)}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.filterSelectLine}>
                    <Select
                      placeholder="כל הצירים"
                      size="small"
                      mode="multiple"
                      value={draftSelectedAxisFilters}
                      onChange={handleDraftAxisFilterChange}
                      className={styles.filterSelect}
                      suffixIcon={
                        <DownOutlined
                          style={{ color: "#000000", fontSize: "10px" }}
                        />
                      }
                      popupMatchSelectWidth={false}
                      style={{ width: "100%" }}
                      maxTagCount={0}
                      showSearch={false}
                      getPopupContainer={(trigger: any) =>
                        trigger.parentElement
                      }
                      maxTagPlaceholder={(omittedVals) =>
                        `${omittedVals.length}+`
                      }
                      options={[
                        { value: -1, label: "כל הצירים" },
                        ...availableAxes.map((axis: any) => ({
                          value: axis.id,
                          label: (
                            <span className={styles.filterOption}>
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  backgroundColor: axis.color,
                                  marginLeft: 8,
                                }}
                              />
                              {axis.name}
                            </span>
                          ),
                        })),
                      ]}
                    />
                    {draftSelectedAxisFilters.length > 0 && (
                      <div className={styles.selectedTagsContainer}>
                        {draftSelectedAxisFilters.map((axisId) => (
                          <Tag
                            key={axisId}
                            className={styles.selectedTag}
                            closable
                            onClose={(e) => {
                              e.preventDefault();
                              removeDraftAxisFilter(axisId);
                            }}
                          >
                            {getAxisName(axisId)}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.filterSelectLine}>
                    <Select
                      placeholder="כל הזמנים"
                      size="small"
                      value={draftTimeFilter}
                      onChange={setDraftTimeFilter}
                      className={`${styles.filterSelect} ${styles.filterSelectSingle}`}
                      suffixIcon={
                        <DownOutlined
                          style={{ color: "#000000", fontSize: "10px" }}
                        />
                      }
                      popupMatchSelectWidth={false}
                      style={{ width: "100%" }}
                      getPopupContainer={(trigger: any) =>
                        trigger.parentElement
                      }
                      options={TIME_FILTER_OPTIONS}
                    />
                  </div>

                  <Button
                    type="primary"
                    className={styles.filterApplyButton}
                    onClick={applyFilters}
                  >
                    פילטור
                  </Button>
                </div>
              }
            >
              <Button className={styles.filterButton} icon={<FilterOutlined />}>
                פילטור
              </Button>
            </Popover>

            <Input
              value={searchTerm}
              onChange={handleSearchChange}
              onPressEnter={handleSearchEnter}
              placeholder="חיפוש לפי שם משימה..."
              prefix={<SearchOutlined />}
              allowClear
              className={styles.headerSearchInput}
            />
          </div>
        </div>
      }
      bordered={false}
    >
      <div className={styles.resultsBar}>
        <div className={styles.resultsCount}>
          <span className={styles.resultsCountText}>
            {sortedTasks.length} משימות
            {filteredTasks.length !== taskCounts.all && (
              <span className={styles.resultsCountFrom}>
                {" "}
                מתוך {taskCounts.all}
              </span>
            )}
          </span>
        </div>

        <div className={styles.actionsContainer}>
          {multiSelectMode && (
            <Tooltip
              title={allSelected ? "בטל בחירת הכל" : "בחר הכל"}
              placement="top"
            >
              <Button
                type="text"
                size="small"
                onClick={handleSelectAllToggle}
                className={`${styles.selectAllButton} ${
                  allSelected ? styles.selectAllActive : ""
                }`}
                icon={<CheckOutlined />}
              >
                {allSelected ? "ביטול הכל" : "בחר הכל"}
              </Button>
            </Tooltip>
          )}

          <div
            className={styles.multiSelectToggleContainer}
            onClick={handleMultiSelectToggleClick}
          >
            <input
              type="checkbox"
              className={styles.customCheckbox}
              checked={multiSelectMode}
              onChange={(e) => handleMultiSelectModeToggle(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className={styles.multiSelectLabel}>גרור כמה</span>
          </div>
        </div>
      </div>

      <div className={styles.taskListContainer}>
        <div className={styles.taskList}>
          {sortedTasks.length === 0 ? (
            <Empty
              description="אין משימות"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: "24px 0" }}
            />
          ) : (
            sortedTasks.map((task: TaskItem) => {
              const taskId = `task-${task.id}`;
              const isSelected = selectedTaskIds.includes(taskId);

              return (
                <div key={task.id} className={styles.taskRowWithCheckbox}>
                  {multiSelectMode && (
                    <div
                      className={styles.externalCheckbox}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={isSelected}
                        onChange={(e) =>
                          handleCheckboxChange(taskId, e.target.checked, e)
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                        }}
                      />
                    </div>
                  )}

                  <DraggableTask
                    task={task}
                    id={taskId}
                    onTaskClick={onTaskClick}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
};

export default HoefTaskPool;
