import React, { useMemo, useState } from "react";
import style from "./studentExpandedView.module.css";
import dayjs, { Dayjs } from "dayjs";
import {
  ArrowLeftOutlined,
  CaretLeftFilled,
  CaretRightFilled,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import { useNavigate } from "react-router-dom";

import { useSelectionsStore } from "../../store/selectionStore";
import { usePermissionStore } from "../../store/permissionStore";
import { useFetchDayTaskAssignement } from "../../hooks/useFetchDayTaskAssignement";
import { useMissedFetchFeedbackByMemberId } from "../../hooks/feedback/useFetchMissedFeedbacksByMemberId";
import { useFetchFormsByUser } from "../../hooks/Forms/useFetchFormsByUserId";
import { getTasksByUser } from "../../services/ApiServices";
import { TaskList } from "../studentStatus/TaskList/TaskList";
import FormStatusTag from "../studentStatus/FormStatusTag/FormStatusTag";
import TaskUserTag from "../../components/Task/TaskTag/TaskUserTag";
import NextTaskView from "../studentStatus/nextTaskView/NextTaskView";
import Photo from "../../UI/Photo/Photo";
import { useTeamMembers } from "../../hooks/useTeamMembers";
import { UserTaskModal } from "../../components/LazyTaskModals";



interface Task {
  id?: number;
  task_id?: number;
  start: string;
  end: string;
  completed_at: string | null;
  completed?: boolean;
  recommendedTime?: number;
  Task?: {
    id?: number;
    task_id?: number;
    recommendedTime?: number;
    name?: string;
  };
}

interface Form {
  taskassignmentid: number;
  end: string;
  start: string;
  completed_at: string | null;
  score: number | null;
  Task?: {
    recommendedTime?: number;
  };
}

interface MergedTaskForm {
  taskassignmentid: number;
  score: number | null;
  id?: number;
  task_id?: number;
  completed?: boolean;
  recommendedTime?: number;
  start: string;
  end: string;
  completed_at: string | null;
  Task?: {
    id?: number;
    task_id?: number;
    recommendedTime?: number;
  };
  _hasForm?: boolean;
  _hasTask?: boolean;
}

type Props = {
  student: any;
  color: string;
  onBack?: () => void;
};

/* ════════════════════════════════════════════════════
   לוגיקה — זהה לחלוטין ל-StudentStatusCard
   ════════════════════════════════════════════════════ */

const getFormStatus = (form: any) => {
  const hasScore =
    form.scorePercentage != null ||
    form.form_score != null ||
    form.score != null;
  const submitted = form.form_completed_at || form.completed_at;
  const started = form.form_started_at || form.started_at;
  const end = form.end || form.assignAt;

  if (hasScore) return "scored";
  if (submitted) return "pending";
  if (started) {
    const isLate = end ? new Date(end).getTime() < Date.now() : false;
    return isLate ? "late" : "inProgress";
  }
  return "notDone";
};

const isTaskMissed = (task: Task): boolean => {
  const now = Date.now();

  if (task.completed_at) return false;

  const recommendedMinutes =
    task.Task?.recommendedTime ?? task.recommendedTime;
  if (recommendedMinutes == null) return false;

  const recommendedEndTime = dayjs(task.start)
    .add(recommendedMinutes, "minutes")
    .toDate()
    .getTime();

  return recommendedEndTime < now;
};

const isFormMissed = (form: Task | Form): boolean => {
  const now = Date.now();

  if (getFormStatus(form) !== "notDone") return false;

  if (form.completed_at) return false;

  const recommendedMinutes = form.Task?.recommendedTime;
  if (recommendedMinutes == null) return false;

  const recommendedEndTime = dayjs(form.start)
    .add(recommendedMinutes, "minutes")
    .toDate()
    .getTime();

  return recommendedEndTime < now;
};

const getNextTask = (
  allTasks: Task[]
):
  | {
      id?: number;
      task_id?: number;
      recommendedTime?: number;
    }
  | undefined => {
  const futureTasks = allTasks
    .filter((task) => new Date(task.start).getTime() > Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return futureTasks[0]?.Task;
};

const mergeTasksWithForms = (
  forms: Form[],
  tasks: Task[]
): MergedTaskForm[] => {
  if (!forms || !tasks) return [];

  return forms
    ?.map((form) => {
      if (!form) return null;

      const matchedTask = tasks.find(
        (task) =>
          form.taskassignmentid === task?.id ||
          form.taskassignmentid === task?.Task?.id
      );
      return matchedTask ? { ...form, ...matchedTask } : null;
    })
    .filter((item): item is MergedTaskForm => item !== null);
};



const StudentExpandedView: React.FC<Props> = ({ student, color, onBack }) => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [activeTab, setActiveTab] = useState<
    "forms" | "tasks" | "feedbacks" | "coincidence"
  >("forms");

  const { selectedTeam, selectedCourseBatch, activeHeaderType,selectedTeamMember } =
    useSelectionsStore();
  const { selectedPermission } = usePermissionStore();


const [selectedTaskId, setSelectedTaskId] = useState<number>(-1);
const [openUserTask, setOpenUserTask] = useState<boolean>(false);

  const [tasksByUser, setTasksByUser] = useState<Task[]>([]);

  const { data: tasksData = [], refetch } = useFetchDayTaskAssignement(
    date.format("YYYY-MM-DD"),
    selectedTeam?.id ?? -1,
    student?.id ?? -1,
    activeHeaderType === "teamMember",
    selectedCourseBatch?.id
  );

  const { data: feedbacks = [] } = useMissedFetchFeedbackByMemberId(student.id);

  const { data: forms = [], refetch: refetchForms } = useFetchFormsByUser(
    student.id,
    selectedTeam?.id,
    undefined,
    selectedCourseBatch?.id,
    selectedPermission?.role_code
  );

  React.useEffect(() => {
    if (student?.user_id && selectedTeam?.id) {
      getTasksByUser(
        student.user_id,
        selectedTeam.id,
        selectedPermission?.role_code,
        selectedCourseBatch?.id
      )
        .then(setTasksByUser)
        .catch(() => setTasksByUser([]));
    }
  }, [student?.user_id, selectedTeam?.id, selectedCourseBatch?.id]);

  React.useEffect(() => {
    if (student?.id && selectedTeam?.id) {
      refetchForms();
    }
  }, [student?.id, selectedTeam?.id, refetchForms]);

  /* ── חישובי memo — זהים ל-StudentStatusCard ── */


  
  const allTasks = useMemo(() => {
    return [
      ...tasksData?.map((task: any) => ({ Task: task })),
      ...tasksByUser,
    ];
  }, [tasksData, tasksByUser]);

  const calendarTasks = useMemo(() => {
    const startOfDay = date.startOf("day").toDate().getTime();
    const endOfDay = date.endOf("day").toDate().getTime();

    return tasksByUser.filter((task) => {
      const taskStart = new Date(task.start).getTime();
      const taskEnd = new Date(task.end).getTime();
      return taskEnd < endOfDay && taskStart > startOfDay;
    });
  }, [tasksByUser, date]);

  const missedTasks = useMemo(() => {
    return tasksByUser.filter(isTaskMissed);
  }, [tasksByUser]);

  const missedTasksWithForms = useMemo(() => {
    return mergeTasksWithForms(forms, tasksByUser).filter(isFormMissed);
  }, [forms, tasksByUser]);

  const nextTask = useMemo(() => {
    return getNextTask(allTasks as Task[]);
  }, [allTasks]);

  const nextTaskStart = useMemo(() => {
    const futureTasks = tasksByUser
      .filter((task) => new Date(task.start).getTime() > Date.now())
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
    return futureTasks[0]?.start ? dayjs(futureTasks[0].start) : undefined;
  }, [tasksByUser]);

  const incompleteTasks = useMemo(() => {
    return tasksByUser.filter((task) => task.completed_at && !task.completed);
  }, [tasksByUser]);

  const incompleteForms = useMemo(() => {
    return forms.filter((form: any) => form.completed_at && !form.score);
  }, [forms]);

  const feedbackNames = useMemo(() => {
    return feedbacks.map((feedback: any) => feedback.feedbackName);
  }, [feedbacks]);




  const selectedTask = useMemo(() => {
  return allTasks.find(
    (t: any) => Number(t.Task?.id || t.id) === selectedTaskId
  );
}, [allTasks, selectedTaskId]);

const selectedTaskCompletedAt = useMemo(() => {
  return (
    allTasks.find(
      (t: any) => Number(t.Task?.task_id) === selectedTaskId
    ) as any
  )?.completed_at;
}, [allTasks, selectedTaskId]);


React.useEffect(() => {
  setOpenUserTask(selectedTaskId !== -1);
}, [selectedTaskId]);

React.useEffect(() => {
  if (!openUserTask) {
    setSelectedTaskId(-1);
  }
}, [openUserTask]);

  const handleDateChange = (direction: "prev" | "next") => {
    setDate((prev) =>
      direction === "prev" ? prev.subtract(1, "day") : prev.add(1, "day")
    );
  };

  const alertColor = (count: number) => (count > 0 ? "#d86a6a" : "#3aa66b");

  const tabs: {
    key: "forms" | "tasks" | "feedbacks" | "coincidence";
    title: string;
    count: number;
  }[] = [
    { key: "forms", title: "מבחנים", count: missedTasksWithForms.length },
    { key: "tasks", title: "משימות", count: missedTasks.length },
    { key: "feedbacks", title: "משובים", count: feedbacks.length },
    {
      key: "coincidence",
      title: "צד חופף",
      count: incompleteForms.length + incompleteTasks.length,
    },
  ];

   const { teamMembers } = useTeamMembers(
      selectedTeam?.id || null,
      Number(selectedCourseBatch?.id)
    );
  



 return (
  <div className={style["page"]}>
    {/* Header קומפקטי */}
    <div className={style["header"]}>
      <button
        className={style["backBtn"]}
        onClick={() => (onBack ? onBack() : navigate(-1))}
      >
        <ArrowLeftOutlined />
      </button>

      <div className={style["avatar"]} style={{ backgroundColor: color }}>
        <Photo
           username={
    selectedTeamMember?.User?.username ||
    teamMembers.find((i) => i?.User?.id === selectedTeamMember?.user_id)
      ?.User?.username
  }
            style={{
              width: "3.5rem",
              height: "3.5rem",
              cursor: "pointer",
            }}
          />
      </div>

      

      <div className={style["headerInfo"]}>
        <h1 className={style["studentName"]}>{student.User?.name || student?.name}</h1>
        <div className={style["studentMeta"]}>
          {selectedTeam?.name && (
            <span className={style["metaBadge"]}>{selectedTeam.name}</span>
          )}
          {selectedCourseBatch?.name && (
            <span className={style["metaBadge"]}>
              {selectedCourseBatch.name}
            </span>
          )}
        </div>
      </div>

    </div>

    {/* גריד ראשי: עמודה שמאלית + עמודת חריגות */}
    <div className={style["layoutGrid"]}>
      {/* עמודה שמאל — לו"ז + משימה הבאה */}
      <div className={style["sideCol"]}>
        <div className={style["panel"]}>
          <div className={style["panelHeader"]}>
            <span className={style["panelTitle"]}>לוח יומי</span>
            <div className={style["dateNav"]}>
              <button onClick={() => handleDateChange("prev")}>
                <CaretRightFilled />
              </button>
              <span className={style["dateLabel"]}>
                {date.format("DD.MM.YY")}
              </span>
              <button onClick={() => handleDateChange("next")}>
                <CaretLeftFilled />
              </button>
            </div>
          </div>

          <TaskList
            tasks={calendarTasks}
            title=""
            showCompleted={true}
          onTaskClick={(task) => {
    setSelectedTaskId(Number(task.taskId ?? task.id ?? task.task_id));
  }}
          />
        </div>

        <div className={style["panel"]}>
          <div className={style["panelHeader"]}>
            <span className={style["panelTitle"]}>המשימה הבאה</span>
          </div>
          <NextTaskView
            setSelectedTaskId={() => undefined}
            task={nextTask}
            start={nextTaskStart}
          />
        </div>
      </div>

      {/* עמודה ימין — חריגות */}
      <div className={style["mainCol"]}>
        <div className={style["panel"]}>
          <div className={style["panelHeader"]}>
            <span className={style["panelTitle"]}>חריגות</span>
          </div>

          <div className={style["tabsBar"]}>
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={
                  activeTab === tab.key
                    ? `${style["tab"]} ${style["tabActive"]}`
                    : style["tab"]
                }
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.title}</span>
                <span
                  className={style["tabCount"]}
                  style={{ color: alertColor(tab.count) }}
                >
                  {tab.count}
                </span>
              </div>
            ))}
          </div>

          <div className={style["tabContent"]}>
            {/* ---- כאן כל 4 התוכן של הטאבים — זהה לחלוטין למה שנשלח קודם ---- */}
            {activeTab === "forms" && (
              missedTasksWithForms.length === 0 ? (
                <div className={style["emptyBlock"]}>אין חריגות מבחנים ✓</div>
              ) : (
                missedTasksWithForms
                  .slice()
                  .sort(
                    (a: any, b: any) =>
                      new Date(a.end).getTime() - new Date(b.end).getTime()
                  )
                  .map((form: any, index: number) => (
                    <div key={form.taskId ?? index} className={style["item"]}>
                      <div className={style["itemBody"]}>
                        <div className={style["itemRow"]}>
                          <span className={style["itemTitle"]}>
                            {form.formTitle.length > 14
                              ? form.formTitle.slice(0, 14) + "..."
                              : form.formTitle}
                          </span>
                          <span className={style["itemTime"]}>
                            {dayjs(form.end).format("DD/MM HH:mm")}
                          </span>
                        </div>
                        <div className={style["itemFooter"]}>
                          <FormStatusTag form={form} />
                        </div>
                        <div className={style["itemSub"]}>
                          מתוך משימה ({form.taskName})
                        </div>
                      </div>
                    </div>
                  ))
              )
            )}

            {activeTab === "tasks" && (
              missedTasks.length === 0 ? (
                <div className={style["emptyBlock"]}>אין חריגות משימות ✓</div>
              ) : (
                missedTasks.map((task: any, index: number) => (
                  <div key={task.Task?.id ?? index} className={style["item"]}>
                    <div className={style["itemBody"]}>
                      <div className={style["itemRow"]}>
                        <span className={style["itemTitle"]}>
                          {task.Task?.name?.length > 14
                            ? task.Task.name.slice(0, 14) + "..."
                            : task.Task?.name || "משימה"}
                        </span>
                        <span className={style["itemTime"]}>
                          {dayjs(task.start).format("DD/MM HH:mm")}
                        </span>
                      </div>
                      <div className={style["itemFooter"]}>
                        <TaskUserTag task={task} />
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === "feedbacks" && (
              feedbacks.length === 0 ? (
                <div className={style["emptyBlock"]}>אין משובים ללא מענה ✓</div>
              ) : (
                feedbacks.map((feedback: any, index: number) => (
                  <div key={feedback.id ?? index} className={style["item"]}>
                    <div className={style["itemBody"]}>
                      <div className={style["itemRow"]}>
                        <span className={style["itemTitle"]}>
                          {feedback.feedbackName}
                        </span>
                        <span className={style["itemTime"]}>
                          {dayjs(feedback.start).format("DD/MM HH:mm")}
                        </span>
                      </div>
                      <span className={style["pendingTag"]}>לא ניתן מענה</span>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === "coincidence" && (
              incompleteForms.length + incompleteTasks.length === 0 ? (
                <div className={style["emptyBlock"]}>אין חריגות צד חופף ✓</div>
              ) : (
                <>
                  {incompleteForms.map((form: any, index: number) => (
                    <div key={form.id ?? index} className={style["item"]}>
                      <div className={style["itemBody"]}>
                        <div className={style["itemRow"]}>
                          <span className={style["itemTitle"]}>
                            {form.formTitle || "מבחן"} — ממתין לבדיקה
                          </span>
                          <span className={style["itemTime"]}>
                            {dayjs(form.end).format("DD/MM HH:mm")}
                          </span>
                        </div>
                        <span className={style["pendingTag"]}>צד חופף</span>
                      </div>
                    </div>
                  ))}
                  {incompleteTasks.map((task: any, index: number) => (
                    <div key={task.id ?? index} className={style["item"]}>
                      <div className={style["itemBody"]}>
                        <div className={style["itemRow"]}>
                          <span className={style["itemTitle"]}>
                            {task.Task?.name}
                          </span>
                          <span className={style["itemTime"]}>
                            {dayjs(task.start).format("DD/MM HH:mm")}
                          </span>
                        </div>
                        <span className={style["pendingTag"]}>
                          צד חופף — לא אושר
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
    {selectedTask && (
  <UserTaskModal
    taskId={Number(selectedTaskId)}
    task={selectedTask}
    setOpenModal={setOpenUserTask}
    openModal={openUserTask}
    completed_at={selectedTaskCompletedAt}
  />
)}
  </div>
);
};

export default StudentExpandedView;