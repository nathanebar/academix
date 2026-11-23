import {
  CaretLeftFilled,
  CaretRightFilled,
  CompressOutlined,
} from "@ant-design/icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "../../../api/queryKeys";
import DayCalendar from "../../../components/layout/Sidebar/DayCalendar/DayCalendar";
import dayjs, { Dayjs } from "dayjs";
import style from "./studentStatusCard.module.css";
import { TeamMembers } from "../../../types/types";
import { useSelectionsStore } from "../../../store/selectionStore";
import { getTasksByUser } from "../../../services/ApiServices";
import NextTaskView from "../nextTaskView/NextTaskView";
import StatusStudentView from "../statusStudentView/StatusStudentView";
import { useFetchFormsByUser } from "../../../hooks/Forms/useFetchFormsByUserId";
import { useFetchDayTaskAssignement } from "../../../hooks/useFetchDayTaskAssignement";
import CoincidenceView from "../CoincidenceView/CoincidenceView";
import { useMissedFetchFeedbackByMemberId } from "../../../hooks/feedback/useFetchMissedFeedbacksByMemberId";
import { UserTaskModal } from "../../../components/LazyTaskModals";
import { usePermissionStore } from "../../../store/permissionStore";
import { TaskList } from "../TaskList/TaskList";

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
  student: TeamMembers;
  color: string;
  expendedAll: boolean;
  onExpand?: (event: React.MouseEvent<HTMLDivElement>) => void;
};


  const getFormStatus = (form: any) => {
  const hasScore =
    form.scorePercentage != null || form.form_score != null || form.score != null;
  const submitted = form.form_completed_at || form.completed_at;
  const started = form.form_started_at || form.started_at;
  const end = form.end || form.assignAt;

  // 1️⃣ יש ציון → הוגש + נוקד
  if (hasScore) return "scored";

  // 2️⃣ הוגש אבל אין ציון → ממתין לבדיקה
  if (submitted) return "pending";

  // 3️⃣ התחיל אבל לא הגיש → בתהליך (או חריגת זמן)
  if (started) {
    const isLate = end ? new Date(end).getTime() < Date.now() : false;
    return isLate ? "late" : "inProgress";
  }

  // 4️⃣ לא התחיל → נשלח אליו (חובה) / לא בוצע
  return "notDone";
};

const isTaskMissed = (task: Task): boolean => {
  const now = Date.now();

  // כבר הוגש — לא חריגה
  if (task.completed_at) return false;

  // לא חובת הגשה (אין זמן מומלץ) — לא חריגה, אפשר לפלטר
  const recommendedMinutes = task.Task?.recommendedTime ?? task.recommendedTime;
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

  // כבר הוגש — לא חריגה
  if (form.completed_at) return false;

  // לא חובת הגשה — לא חריגה
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

// stable empty value: a new `[]` default on every render re-runs the memos / effects that depend on it
const NO_TASKS: any[] = [];

const StudentStatusCard: React.FC<Props> = ({
  student,
  color,
  expendedAll,
   onExpand,
}) => {

 
  
  const [selectedTaskId, setSelectedTaskId] = useState<number>(-1);
  const [openUserTask, setOpenUserTask] = useState<boolean>(false);
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [showForms, setShowForms] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(expendedAll);


  const { selectedTeam, selectedCourseBatch, activeHeaderType } =
    useSelectionsStore();
      const { selectedPermission } = usePermissionStore();

      console.log("date",date);
      console.log("date",date.format("YYYY-MM-DD"));
      
  const {
    data: tasksData = NO_TASKS,
    refetch,
    dataUpdatedAt: dayTasksUpdatedAt,
  } = useFetchDayTaskAssignement(
    date.format("YYYY-MM-DD"),
    selectedTeam?.id ?? -1,
    student?.id ?? -1,
    activeHeaderType === "teamMember",
    selectedCourseBatch?.id
  );

  // The student's tasks: same key as StudentExpandedView, so both views share the cache.
  const queryClient = useQueryClient();
  const tasksByUserKey = taskKeys.byUser(
    student?.user_id,
    selectedTeam?.id,
    selectedPermission?.role_code,
    selectedCourseBatch?.id
  );
  const { data: tasksByUser = NO_TASKS } = useQuery({
    queryKey: tasksByUserKey,
    queryFn: async (): Promise<Task[]> => {
      try {
        return await getTasksByUser(
          student.user_id,
          selectedTeam!.id,
          selectedPermission?.role_code,
          selectedCourseBatch?.id
        );
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return [];
      }
    },
    enabled: !!student?.user_id && !!selectedTeam?.id,
    staleTime: 0, // refetch on every mount, like the former useEffect
  });

  // Same signature as the former useState setter: the child views remove a task locally after
  // approving it (optimistic update), now in the query cache.
  const setTasksByUser: React.Dispatch<React.SetStateAction<Task[]>> = useCallback(
    (update) =>
      queryClient.setQueryData<Task[]>(tasksByUserKey, (old = []) =>
        typeof update === "function" ? update(old) : update
      ),
    // the key parts (spread), not the key array itself, which is a new array on every render
    [queryClient, ...tasksByUserKey]
  );

  // The former effect refetched the student's tasks whenever the day's tasks changed. It depended
  // on `tasksData`, whose `= []` default was a new array on every render, so it also refetched on
  // every render while the day's tasks were loading (3-5 requests per student). Keep the intent,
  // but only on a real update of the day's tasks, and not on their first load.
  const lastDayTasksUpdate = useRef(dayTasksUpdatedAt);
  useEffect(() => {
    if (lastDayTasksUpdate.current && dayTasksUpdatedAt !== lastDayTasksUpdate.current) {
      // cancelRefetch: false → if the tasks are already being fetched, don't start a second request
      queryClient.invalidateQueries({ queryKey: tasksByUserKey, exact: true }, { cancelRefetch: false });
    }
    lastDayTasksUpdate.current = dayTasksUpdatedAt;
    // only dayTasksUpdatedAt: runs on a real update of the day's tasks (see above)
  }, [dayTasksUpdatedAt]);


  
  const { data: feedbacks = [] } = useMissedFetchFeedbackByMemberId(student.id);

 
  
  const { data: forms = [], refetch: refetchForms } = useFetchFormsByUser(
    student.id,
    selectedTeam?.id,
    undefined,
    selectedCourseBatch?.id,
    selectedPermission?.role_code

  );

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
    return mergeTasksWithForms(forms, tasksByUser).filter(isFormMissed);;
  }, [forms, tasksByUser]);



  const nextTask = useMemo(() => {
    return getNextTask(allTasks as Task[]);
  }, [allTasks]);


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
  
  const toggleFormsDisplay = useCallback(() => {
    setShowForms((prev) => !prev);
  }, []);

  useEffect(() => {
    setIsExpanded(expendedAll);
  }, [expendedAll]);

  useEffect(() => {
    if (student?.id && selectedTeam?.id) {
      refetchForms();
    }
  }, [student?.id, selectedTeam?.id, refetchForms]);

  useEffect(() => {
    setOpenUserTask(selectedTaskId !== -1);
  }, [selectedTaskId]);

  useEffect(() => {
    if (!openUserTask) {
      setSelectedTaskId(-1);
    }
  }, [openUserTask]);

  const handleDateChange = (direction: "prev" | "next") => {
    setDate((prev) =>
      direction === "prev" ? prev.subtract(1, "day") : prev.add(1, "day")
    );
  };

  const handleExpandClick = () => setIsExpanded(true);

  const handleCollapseClick = () => setIsExpanded(false);

  const hasNoTeam = !selectedTeam;
  
  if (hasNoTeam) {
    return null;
  }

  if (isExpanded) {
    return (
      <div onClick={handleCollapseClick} className={style["card_expended"]}>
        <div style={{ rotate: "270deg" }}>
          <div
            className={style["student_name_expended"]}
            style={{ backgroundColor: color }}
          >
            {student.User.name}
          </div>
        </div>
      </div>
    );
  }

 
  
  return (
    <div className={style["card"]} >

   
    {student?.User?.name && (
      <div className={style["nameTab"]} style={{background:color}} onClick={onExpand} >
      <span className={style["nameTabDot"]} />
      <span className={style["nameTabText"]}>{student.User.name}</span>
    </div>
  )}
  <CompressOutlined
    className={style["expanded_button"]}
    onClick={handleExpandClick}
  />

      <div className={style["calendar"]}>

       {/*  <div className={style["calendar-header"]}>
          <div style={{ fontWeight: "bold" }}>לוח שנה</div>
          <div>
            <CaretRightFilled onClick={() => handleDateChange("prev")} />
            {date.format("DD.MM.YY")}
            <CaretLeftFilled onClick={() => handleDateChange("next")} />
          </div>
        </div> */}
       {/*  <DayCalendar
          style={{ height: "100%" }}
          date={date.toDate()}
          startHour={date.subtract(120, "minute").format("HH:00:00")}
          endHour={date.add(180, "minute").format("HH:00:00")}
          student={student}
          tasksByUser={calendarTasks}
        /> */}

         <TaskList
      tasks={calendarTasks}
      title="לוח יומי"
      showCompleted={true}
      onTaskClick={(task) => {
    setSelectedTaskId(Number(task.taskId ?? task.id ?? task.task_id));

  }}
    />
      </div>


      <NextTaskView
      setSelectedTaskId={setSelectedTaskId}
      task={nextTask}
      start={nextTaskStart}
      />
    

      <StatusStudentView
        setSelectedTaskId={setSelectedTaskId}
        setShowForms={toggleFormsDisplay}
        tasks={missedTasks as any}
        tasksLength={missedTasks.length}
        setTasks={setTasksByUser}
        formsLength={missedTasksWithForms.length}
        forms={missedTasksWithForms}
        showForms={showForms}
        userName={student?.User?.name}
      />


      <CoincidenceView
        setSelectedTaskId={setSelectedTaskId}
        feedbacks={feedbacks}
  
        setShowForms={toggleFormsDisplay}
        tasks={incompleteTasks as any}
        tasksLength={incompleteTasks.length}
        setTasks={setTasksByUser}
        formsLength={showForms ? incompleteForms.length : 0}
        forms={showForms ? incompleteForms : []}
      />

{
  selectedTask &&
      <UserTaskModal
      taskId={Number(selectedTaskId)}
      task={selectedTask}
      setOpenModal={setOpenUserTask}
      openModal={openUserTask}
      completed_at={selectedTaskCompletedAt}
      />
    }
    </div>
  );
};

export default StudentStatusCard;