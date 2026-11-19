// TaskList.tsx
import React, { useMemo } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjsRelative from "dayjs/plugin/relativeTime";
import "dayjs/locale/he";
import styles from "./TaskList.module.css";
import { getTaskCubeColors } from "../../../utils/colors";

dayjs.extend(customParseFormat);
dayjs.extend(dayjsRelative);
dayjs.locale("he");

export type TaskLike = {
  start: string;
  end: string;
  task_id?: number | string; 
  taskName?: string;
  taskId?: number | string;
  taskGroupName?: string;
  taskRecommendedTime?: number | string | null;
  task_status?: string;
  axisColor?: string;

  name?: string;
  id?: number | string;
  groupName?: string;
  color?: string;
  status?: string;

  completed?: boolean | null;
 completed_at?: string | null; 
  isLocked?: boolean;
  hasExposure?: boolean;
  notRequiredToSubmit?: boolean;
};

type TaskListProps = {
  tasks: TaskLike[];
  title?: string;
  emptyMessage?: string;
  showCompleted?: boolean;
   onTaskClick?: (task: TaskLike) => void; 
};

const isValidTime = (value: unknown): value is string =>
  !!value && !Number.isNaN(new Date(value as string).getTime());

export function TaskList({
  tasks,
  title = "משימות",
  emptyMessage = "אין משימות לטווח הזמן הזה",
  showCompleted = true,
   onTaskClick, 
}: TaskListProps) {
  
  
 
    const normalized = useMemo(() => {
    return tasks
      .filter((t) => isValidTime(t.start) && isValidTime(t.end))
      .map((t) => ({
        id: t.taskId ?? t.id,
        name: t.taskName ?? t.name ?? "משימה",
        group: t.taskGroupName ?? t.groupName ?? "",
        recommendedTime: t.taskRecommendedTime ?? null,
        color: t.axisColor ?? t.color,
        status: t.task_status ?? t.status,
        start: t.start,
        end: t.end,
        completed: !!t.completed,
        completed_at: t.completed_at ?? null,
        isLocked: !!t.isLocked,
      }))
      .sort(
        (a, b) =>
          dayjs(a.start).valueOf() - dayjs(b.start).valueOf() ||
          dayjs(a.end).valueOf() - dayjs(b.end).valueOf()
      );
  }, [tasks]);

  const visible =
    showCompleted === false
      ? normalized.filter((t) => !t.completed)
      : normalized;

  if (visible.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <span>{emptyMessage}</span>
      </div>
    );
  }

  
  return (
    <div className={styles.wrapper}>
      {title && <h3 className={styles.title}>{title}</h3>}

      <ul className={styles.list}>
        {visible.map((task) => {
          const start = dayjs(task.start);
          const end = dayjs(task.end);
          
          const { from: cubeFrom, to: cubeTo, textColor } = getTaskCubeColors(task.color); 
          
         
          return (
            <li
              key={`${task.id}-${task.start}`}
              onClick={() => onTaskClick?.(task)}
              className={[
                styles.item,
                task.completed ? styles.completed : "",
                task.isLocked ? styles.locked : "",
                onTaskClick ? styles.clickable : "", 
              ]
                .filter(Boolean)
                .join(" ")}
            >
           

               <span
    className={styles["timeBar"]}
    style={{
      background: `linear-gradient(180deg, ${cubeFrom}, ${cubeTo}cc)`,
    }}
  />

              <div
                className={styles.timeCube}
              style={{ 
            color:'#8a93a2'
              
             }}
              >
           


 <span className={styles["timeCubeHour"]}>
    {start ? start.format("HH:mm") : "--:--"}
  </span>
              </div>

              <div className={styles.content}>
                <div className={styles.rowTop}>
                  <span className={styles.name}>{task.name}</span>
                 
                </div>

                <div className={styles.rowBottom}>
                  <span className={styles.group}>{task.group}</span>

                  <div className={styles.meta}>
                  {/*   {task.recommendedTime != null && (
                      <span className={styles.badge}>
                        ⏱ {task.recommendedTime} דקות
                      </span>
                    )} */}
                    {task.isLocked && (
                      <span className={styles.badgeLocked}>נעולה</span>
                    )}
                    {task.completed && (
                      <span className={styles.badgeDone}>✓ הושלמה</span>
                    )}
                    {!task.completed && task?.completed_at && (
                      <span className={styles.badgeDoneCompletedAt}>בוצעה</span>
                    )}
                    {!task.completed && !task?.completed_at && (
                      <span className={styles.badgeDoneAtProcess}>בתהליך</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}