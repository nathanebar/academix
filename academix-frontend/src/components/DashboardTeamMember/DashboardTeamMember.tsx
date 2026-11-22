import { useSelectionsStore } from "../../store/selectionStore";
import FormDiv from "../../utils/FormDiv/FormDiv";
import style from "./DashboardTeamMember.module.css";
import { useFetchFormsByUser } from "../../hooks/Forms/useFetchFormsByUserId";
import {
  getTasksByUser,
  getTeamMemberByUserIdAndTeamId,
} from "../../services/ApiServices";
import { useCallback, useEffect, useState, useMemo } from "react";
import MissionDiv from "../../utils/MissionDiv/MissionDiv";
import { useFetchFeedbackByUserId } from "../../hooks/feedback/useFetchFeedbackByUser";
import FeedbackCardByUser from "../../pages/Feedback/FeedbackDashboardByUser/FeedbackCardByUser/FeedbackCardByUser";
import { UserTaskModal } from "../LazyTaskModals";
import dayjs, { Dayjs } from "dayjs";
import { usePermissionStore } from "../../store/permissionStore";
import FeedbackCategoryChar from "../FeedbackCategoryChar/FeedbackCategoryChar";
import SimpleCalendar from "./SimpleCalendar/SimpleCalendar";
import { TeamMembers } from "../../types/types";
import NextTaskView from "../../pages/studentStatus/nextTaskView/NextTaskView";
import ProgressLevelsCard from "../../components/progressLevelsCard/ProgressLevelsCard";
import { Button, Menu, notification, Tabs } from "antd";
import TaskUserTag from "../Task/TaskTag/TaskUserTag";
import { FileTextOutlined } from "@ant-design/icons";
import { useTaskTeamMemberRefreshStore } from "../../store/taskTeamMemberRefreshStore";
import TabPane from "antd/es/tabs/TabPane";
import { getQueueTasksByMemberFlat } from "../../services/ApiServices";

const DashboardTeamMember = () => {
  const { selectedTeamMember, selectedTeam, selectedCourseBatch } =
    useSelectionsStore();
  const { selectedPermission } = usePermissionStore();
  const isCommanderOrAdmin = selectedPermission?.role_code !== "STUDENT";
  const [missionData, setMissionData] = useState<any>();
  const [selectedTaskId, setSelectedTaskId] = useState<number>(-1);
  const { data: forms, refetch } = useFetchFormsByUser(
    Number(selectedTeamMember?.id),
    selectedTeam?.id,
    undefined,
    selectedCourseBatch?.id,
    selectedPermission?.role_code,
  );

  useEffect(() => {
    const uid = Number(selectedTeamMember?.user_id);
    if (uid && !Number.isNaN(uid) && uid > 0) {
      refetch();
    }
  }, [selectedTeamMember?.user_id, refetch]);

  const [openUserModal, setOpenUserModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [dateFilterType, setDateFilterType] = useState<string>("0"); // 🆕 שינוי
  const [queueTasks, setQueueTasks] = useState<any[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const needsRefresh = useTaskTeamMemberRefreshStore(
    (state) => state.needsRefresh,
  );
  const clearRefresh = useTaskTeamMemberRefreshStore(
    (state) => state.clearRefresh,
  );

  // 🆕 פונקציה לסינון לפי קטגוריות חדשות
  const changeDateFilters = (activeKey: string) => {
    setDateFilterType(activeKey);
  };

  // 🆕 פונקציה לסינון משימות לפי קטגוריה
  const filterTasksByCategory = useCallback((tasks: any[]) => {
    if (!tasks || tasks.length === 0) return [];

    const now = dayjs();
    const startOfToday = now.startOf('day');
    const endOfToday = now.endOf('day');
    const startOfWeek = now.startOf('week');
    const endOfWeek = now.endOf('week');

    switch (dateFilterType) {
      case "0": // היום
        return tasks.filter((task: any) => {
          const taskDate = dayjs(task.start);
          return taskDate.isSame(startOfToday, 'day');
        });

      case "1": // השבוע
        return tasks.filter((task: any) => {
          const taskDate = dayjs(task.start);
          return taskDate.isSame(startOfWeek, 'week');
        });

      case "2": // עתידיות
        return tasks.filter((task: any) => {
          const taskDate = dayjs(task.start);
          return taskDate.isAfter(endOfToday);
        });

      case "3": // עבר
        return tasks.filter((task: any) => {
          const taskDate = dayjs(task.start);
          return taskDate.isBefore(startOfToday);
        });

        case "5": // בתור
      return tasks.filter((task: any) => task.isQueueTask === true);

      case "4":
      default:
        return tasks;

      case "5": // רק להיום (אוויל ללוח שנה)
        return tasks.filter((task: any) => {
          const taskDate = dayjs(task.start);
          return taskDate.isSame(startOfToday, 'day');
        });
    }
  }, [dateFilterType]);

  // 🆕 ספירת משימות לכל קטגוריה
  const taskCounts = useMemo(() => {
    if (!missionData || missionData.length === 0) {
      return { today: 0, week: 0, future: 0, past: 0, all: 0 };
    }

    const now = dayjs();
    const startOfToday = now.startOf('day');
    const endOfToday = now.endOf('day');
    const startOfWeek = now.startOf('week');
    const endOfWeek = now.endOf('week');

    const counts = {
      today: 0,
      week: 0,
      future: 0,
      past: 0,
      all: missionData.length,
    };

    missionData.forEach((task: any) => {
      if (task.isQueueTask) {
        return;
      }
      const taskDate = dayjs(task.start);

      if (taskDate.isSame(startOfToday, 'day')) {
        counts.today++;
      }
      if (taskDate.isSame(startOfWeek, 'week')) {
        counts.week++;
      }
      if (taskDate.isAfter(endOfToday)) {
        counts.future++;
      }
      if (taskDate.isBefore(startOfToday)) {
        counts.past++;
      }
    });

    return counts;
  }, [missionData]);

  const queueTaskCount = useMemo(() => {
    if (!missionData) return 0;
    return missionData.filter((t: any) => t.isQueueTask).length;
  }, [missionData]);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedTeamMember?.id && selectedTeam?.id) {
        const skipVisibility = selectedPermission?.role_code !== "STUDENT";
        const data = await getTasksByUser(
          Number(selectedTeamMember?.user_id),
          selectedTeam?.id ? Number(selectedTeam?.id) : null,
          selectedPermission?.role_code,
          selectedCourseBatch.id,
          skipVisibility,
          dayjs().subtract(1, "year"), // 🆕 תמיד שולף הרבה נתונים
          dayjs().add(1, "year"),
        );
        const filteredData = data.filter((t: any) => !t.isOccurrence);

        const queueData = await getQueueTasksByMemberFlat(
          selectedTeam?.id ? Number(selectedTeam?.id) : 0,
          selectedCourseBatch.id,
          selectedTeamMember.id
        );

        const allTasks = [...filteredData, ...queueData];

        setMissionData(allTasks);
        setQueueTasks(queueData);

        if (selectedEvent?.id) {
          const taskAssignmentId = selectedEvent?.id;
          const updatedTask = filteredData.find(
            (t: any) => t.id === taskAssignmentId,
          );
          if (updatedTask) {
            setSelectedEvent((prev: any) => ({
              ...prev,
              extendedProps: {
                ...prev.extendedProps,
                completed_at: updatedTask.completed_at,
              },
            }));
          }
        }
        clearRefresh();
      }
    };

    fetchData();
  }, [
    selectedTeamMember,
    selectedPermission?.role_code,
    selectedTeam,
    selectedCourseBatch,
    refreshCount,
    needsRefresh,
    clearRefresh,
  ]);

  const { data, isLoading, isError, error } = useFetchFeedbackByUserId(
    selectedTeamMember?.id || selectedTeamMember?.User?.id,
    selectedPermission?.role_code,
  );

  // 🆕 סינון המשימות לפי הקטגוריה שנבחרה
  const filteredTasks = useMemo(() => {
    return filterTasksByCategory(missionData);
  }, [missionData, filterTasksByCategory]);

  const nextTask = useMemo(() => {
    if (!filteredTasks || filteredTasks.length === 0) return null; // 🆕 שינוי ל-filteredTasks
    const now = new Date();
    const futureTasks = filteredTasks // 🆕 שינוי ל-filteredTasks
      .filter((task: any) => {
        const taskStart = new Date(task.start);
        return taskStart > now && task.completed_at === null;
      })
      .map((task: any) => {
        const isExposure = task.exposure === true;
        const start = new Date(task.start);
        const isLocked = isExposure && now < start;

        return {
          ...task,
          isLocked: isLocked,
          hasExposure: isExposure,
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
    return futureTasks[0] || null;
  }, [filteredTasks]); // 🆕 שינוי ל-filteredTasks

  const nextTaskStart = useMemo(() => {
    if (!nextTask) return null;
    return dayjs(nextTask.start);
  }, [nextTask]);

  // 🆕 פונקציה לסינון משימות לפי סטטוס
  const getFilteredTasksByCategory = useCallback(() => {
    const tasks = filteredTasks; // 🆕 שינוי ל-filteredTasks
    if (!tasks) return { pending: [], pendingReview: [], approved: [], notRequiredToSubmit: [] };

    const sortByStart = (a: any, b: any) => {
      const dateA = a.start ? new Date(a.start).getTime() : 0;
      const dateB = b.start ? new Date(b.start).getTime() : 0;
      return dateB - dateA;
    };

    const pending: any[] = [];
    const pendingReview: any[] = [];
    const approved: any[] = [];
    const notRequiredToSubmit: any[] = [];

    tasks.forEach((mission: any) => {
      const hasCompletedAt =
        mission.completed_at !== null && mission.completed_at !== undefined;
      const hasCompleted =
        mission.completed !== null && mission.completed !== undefined;
      if (mission.notRequiredToSubmit) {
        notRequiredToSubmit.push(mission);
      } else if (hasCompleted) {
        approved.push(mission);
      } else if (hasCompletedAt) {
        pendingReview.push(mission);
      } else {
        pending.push(mission);
      }
    });

    return {
      pending: [...pending].sort(sortByStart),
      pendingReview: [...pendingReview].sort(sortByStart),
      approved: [...approved].sort(sortByStart),
      notRequiredToSubmit: [...notRequiredToSubmit].sort(sortByStart),
    };
  }, [filteredTasks]); // 🆕 שינוי ל-filteredTasks

  const { pending, pendingReview, approved, notRequiredToSubmit } =
    getFilteredTasksByCategory(); // 🆕 שינוי לשם

  const aggregatedFeedback = useMemo(() => {
    if (!data || data.length === 0) return null;

    if (data.length === 1) {
      return data[0];
    }

    const feedbackMap = new Map();

    data.forEach((feedback: any) => {
      const feedbackId = feedback.feedbackId;

      if (!feedbackMap.has(feedbackId)) {
        feedbackMap.set(feedbackId, {
          ...feedback,
          categories: [],
        });
      }

      const existingFeedback = feedbackMap.get(feedbackId);
      feedback.categories?.forEach((category: any) => {
        const existingCategory = existingFeedback.categories.find(
          (c: any) => c.categoryName === category.categoryName,
        );

        if (existingCategory) {
          existingCategory.counts = {
            improvement:
              (existingCategory.counts?.improvement || 0) +
              (category.counts?.improvement || 0),
            preservation:
              (existingCategory.counts?.preservation || 0) +
              (category.counts?.preservation || 0),
          };
        } else {
          existingFeedback.categories.push({ ...category });
        }
      });
    });

    return Array.from(feedbackMap.values());
  }, [data]);

  const sortedFeedbackData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data].sort((a, b) => {
      const dateA = new Date(a.feedbackCreatedAt || 0).getTime();
      const dateB = new Date(b.feedbackCreatedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [data]);

  function transformMission(m: any): any {
    return {
      id: m.id,
      title: m.name,
      start: dayjs(m.most_frequent_assigned_at_start || m.assigned).toISOString(),
      end: dayjs(m.most_frequent_assigned_at_end).toISOString(),
      allDay: false,
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: "black",
      extendedProps: {
        groupName: m.gn,
        taskColor: m.color,
        source: m.source,
        status: m.status,
        creatorName: m.creatorName,
        creatorUsername: m.creatorUsername,
        completed_at: m.completed_at,
        completed: m.completed,
        taskassignmentid: m.taskassignmentid,
        task_id: m.taskId || m.task_id,
        isLocked: m.isLocked || false,
        isQueueTask: m.isQueueTask || false,
        hasExposure: m.hasExposure || false,
      },
    };
  }

  const MissionCategory = ({
    title,
    tasks,
    emptyMessage,
    categoryColor,
    timelineVisible,
  }: {
    title: string;
    tasks: any[];
    emptyMessage: string;
    categoryColor: string;
    timelineVisible: boolean;
  }) => (
    <div
      className={style.categoryContainer}
      style={{ borderRightColor: categoryColor, borderRightWidth: 4 }}
    >
      <div className={style.titles}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className={style.categoryIndicator}
            style={{ backgroundColor: categoryColor }}
          />
          <p style={{ color: "GrayText" }} className={style.firstTitle}>
            {title}
          </p>
        </div>
        {tasks.length > 0 && (
          <span
            className={style.countBadge}
            style={{ backgroundColor: categoryColor }}
          >
            {tasks.length}
          </span>
        )}
      </div>
      <div className={style.categoryContent}>
        {tasks.length > 0 ? (
          tasks.map((mission: any) => (
            <MissionDiv
              key={mission.id}
              mission={mission}
              onClick={(isLocked: any) => {
                if (isCommanderOrAdmin) {
                  const transformed = transformMission(mission);
                  setSelectedEvent(transformed);
                  setOpenUserModal(true);
                } else {
                  if (isLocked) {
                    notification.warning({
                      message: "המשימה נעולה",
                      description: "המשימה תהיה זמינה רק בזמן השיבוץ",
                      placement: "topRight",
                      duration: 3,
                    });
                    return;
                  }
                  const transformed = transformMission(mission);
                  setSelectedEvent(transformed);
                  setOpenUserModal(true);
                }
              }}
              isCommanderOrAdmin={isCommanderOrAdmin}
              timelineVisible={timelineVisible}
            />
          ))
        ) : (
          <span className={style.emptyMessage}>{emptyMessage}</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={style.gridContainer}>
        {/* 🆕 עדכון ה-Tabs */}
        <Tabs
          defaultActiveKey="0"
          // style={{ width: "25vw", left: 0, top: "9vh", position: "absolute" }}
          onChange={changeDateFilters}
        >
          {[
            { key: "0", label: "היום", count: taskCounts.today },
            { key: "1", label: "השבוע", count: taskCounts.week },
            { key: "2", label: "עתידיות", count: taskCounts.future },
            { key: "5", label: "בתור", count: queueTaskCount },
            // { key: "3", label: "עבר", count: taskCounts.past },
            { key: "4", label: "הכל", count: taskCounts.all },
          ].map((option) => (
            <TabPane
              key={option.key}
              tab={
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{option.label}</span>
                  <span
                    style={{
                      background: dateFilterType === option.key ? "#fff" : "rgba(255,255,255,0.3)",
                      borderRadius: "10px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {option.count}
                  </span>
                </div>
              }
            />
          ))}
        </Tabs>

        <div className={style.topRow}>
          {selectedTeamMember && (
            <div className={style.calendarContainer}>
              <SimpleCalendar
                filters={{ startFilter: dayjs().startOf('day'), endFilter: dayjs().endOf('day') }}
                student={selectedTeamMember as TeamMembers}
              />
            </div>
          )}

          <div className={style.missionsContainer}>
            <div className={style.missionsWrapper}>
              <MissionCategory
                title="משימות ממתינות לביצוע"
                tasks={pending}
                emptyMessage="אין משימות לביצוע"
                categoryColor="#3b82f6"
                timelineVisible={true}
              />
              <MissionCategory
                title="משימות ממתינות לבדיקה"
                tasks={pendingReview}
                emptyMessage="אין משימות לבדיקה"
                categoryColor="#f59e0b"
                timelineVisible={true}
              />
              <MissionCategory
                title="משימות שאושרו"
                tasks={approved}
                emptyMessage="אין משימות מאושרות"
                categoryColor="#10b981"
                timelineVisible={true}
              />
              <MissionCategory
                title="לא נדרש להגשה"
                tasks={notRequiredToSubmit}
                emptyMessage="אין משימות"
                categoryColor="#cfcfcf"
                timelineVisible={false}
              />
            </div>

            {data && data.length > 0 && (
              <div className={style.feedbacksContainer}>
                <div className={style.feedbackCardsWrapper}>
                  {sortedFeedbackData.map((item: any) => (
                    <FeedbackCardByUser key={item.id} feedback={item} />
                  ))}
                </div>
              </div>
            )}

            {(!data || data.length === 0) && (
              <div className={style.noFeedbacks}>
                <FileTextOutlined className={style.noFeedbacksIcon} />
                <span className={style.noFeedbacksText}>אין משובים כרגע</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <UserTaskModal
          taskId={Number(selectedEvent?.extendedProps?.task_id)}
          taskAssignment={Number(
            selectedEvent?.extendedProps?.taskassignmentid,
          )}
          completed_at={selectedEvent?.extendedProps?.completed_at}
          task={filteredTasks?.find((t: any) => t.id === selectedEvent.id)} // 🆕 שינוי
          openModal={openUserModal}
          setOpenModal={setOpenUserModal}
          onRefresh={() => setRefreshCount((c) => c + 1)}
        />
      )}
      {selectedTaskId !== -1 && nextTask && (
        <UserTaskModal
          taskId={Number(nextTask.task_id)}
          completed_at={nextTask.completed_at}
          task={nextTask}
          openModal={selectedTaskId !== -1}
          setOpenModal={(open) => {
            if (!open) setSelectedTaskId(-1);
          }}
          onRefresh={() => setRefreshCount((c) => c + 1)}
        />
      )}
    </>
  );
};

export default DashboardTeamMember;