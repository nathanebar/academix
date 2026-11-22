import {
  CaretLeftOutlined,
  CaretRightOutlined,
  EyeInvisibleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import React, { useState, useEffect, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs, { Dayjs } from "dayjs";
import style from "./SimpleCalendar.module.css";
import {
  TeamEvent,
  TeamEventAssignment,
  TeamMembers,
} from "../../../types/types";
import { useSelectionsStore } from "../../../store/selectionStore";
import { getTasksByUser } from "../../../services/ApiServices";
import { schemaMap, SchemaName } from "../../../types/types";
import { UserTaskModal } from "../../LazyTaskModals";
import { notification, Tooltip } from "antd";
import { usePermissionStore } from "../../../store/permissionStore";
import { useTeamEventAssignment } from "../../../hooks/useFetchTeamEventAssignments";
import { useTeamEvent } from "../../../hooks/useTeamEvent";

interface Task {
  id?: number;
  task_id?: number;
  start: string;
  end: string;
  completed_at: string | null;
  completed?: boolean;
  recommendedTime?: number;
  Task?: any;
}

interface Props {
  student: TeamMembers;
  filters: { startFilter: Dayjs; endFilter: Dayjs };
}

const SimpleCalendar: React.FC<Props> = ({ student, filters }) => {
  const [date, setDate] = useState(dayjs());
  const [tasksByUser, setTasksByUser] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [openUserModal, setOpenUserModal] = useState<boolean>(false);

  const { data: teamEvents = [] } = useTeamEvent();
  const { data: teamEventAssignments = [] } = useTeamEventAssignment();

  const { selectedTeam, selectedCourseBatch } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (student?.user_id && selectedTeam?.id) {
        const tasks = await getTasksByUser(
          student.user_id,
          selectedTeam.id,
          selectedPermission?.role_code,
          selectedCourseBatch.id,
          false,
          filters.startFilter,
          filters.endFilter,
        );
        setTasksByUser(tasks || []);
      }
    };
    fetchTasks();
  }, [student?.user_id, selectedTeam?.id, filters]);

  useEffect(() => {
    if (calendarRef.current && date) {
      const timer = setTimeout(() => {
        if (calendarRef.current) {
          calendarRef.current.getApi().gotoDate(date.toDate());
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [date]);

  const calendarEvents = useMemo(() => {
    if (!tasksByUser || tasksByUser.length === 0) return [];

    const selectedDate = date.toDate();
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = tasksByUser.filter((task) => {
      const taskStart = new Date(task.start);
      const taskEnd = new Date(task.end);
      return taskStart <= endOfDay && taskEnd >= startOfDay;
    });

    return filtered.map((task) => {
      const taskColor: SchemaName = task.Task?.TaskGroup?.Axis?.color ?? "null";
      const colorGradient = schemaMap[taskColor] || schemaMap["null"];

      return {
        id: String(task.id),
        title: task.Task?.name || "משימה",
        start: dayjs(task.start).toISOString(),
        end: dayjs(task.end).toISOString(),
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: "black",
        extendedProps: {
          groupName: task.Task?.TaskGroup?.name || "",
          taskColor: taskColor,
          task_id: task.task_id,
          source: "assignment",
          taskData: task,
        },
      };
    });
  }, [tasksByUser, date]);

  const handleDateChange = (direction: "prev" | "next") => {
    setDate((prev) =>
      direction === "prev" ? prev.subtract(1, "day") : prev.add(1, "day"),
    );
  };

  const handleEventClick = (info: any) => {
    if (info.event.extendedProps.source === "assignment"){
      const taskData = info.event.extendedProps.taskData;
    const isStudent = selectedPermission?.role_code === "STUDENT";
    const isLocked = taskData?.isLocked || false;

    if (isStudent && isLocked) {
      notification.warning({
        message: "המשימה נעולה",
        description: "המשימה תהיה זמינה רק בזמן השיבוץ",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    setSelectedTask(taskData);
    setOpenUserModal(true);
  }};

  return (
    <>
      <div className={style.container}>
        <div className={style.header}>
          <div className={style.title}>
            {/* <CalendarOutlined /> */}
            לוח שנה
          </div>

          <div className={style.dateNav}>
            <button
              className={style.dateNavBtn}
              onClick={() => handleDateChange("prev")}
              title="יום קודם"
            >
              <CaretRightOutlined />
            </button>

            <span className={style.dateNavLabel}>
              {date.format("DD.MM.YY")}
            </span>

            <button
              className={style.dateNavBtn}
              onClick={() => handleDateChange("next")}
              title="יום הבא"
            >
              <CaretLeftOutlined />
            </button>
          </div>
        </div>
        <div className={style.calendarWrapper}>
          <FullCalendar
            viewClassNames={() => [style["my-calendar"]]}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridDay"
            timeZone="local"
            initialDate={date.toDate()}
            ref={calendarRef}
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit" }}
            editable={false}
            droppable={false}
            allDaySlot={false}
            height="100%"
            slotMinTime={"06:00:00"}
            slotMaxTime={"24:00:00"}
            slotDuration="00:30:00"
            slotLabelInterval="00:30:00"
            headerToolbar={false}
            nowIndicator={true}
            locale="he"
            direction="rtl"
            events={[
              ...calendarEvents,
              ...teamEventAssignments.map(
                (teamEventAssignment: TeamEventAssignment) => ({
                  ...teamEvents?.find(
                    (teamEvent: TeamEvent) =>
                      teamEvent?.id === teamEventAssignment?.TeamEventId,
                  ),
                  extendedProps: {
                    task_id: teamEventAssignment.id,
                    source: "teamEvent",
                    taskData: teamEventAssignment,
                    taskColor: teamEvents?.find(
                      (teamEvent: TeamEvent) =>
                        teamEvent?.id === teamEventAssignment?.TeamEventId,
                    )?.color,
                  },
                  ...teamEventAssignment,
                }),
              ),
            ]}
            eventClick={handleEventClick}
            eventContent={(arg) => {
              const taskColor: SchemaName =
                arg.event.extendedProps.taskColor ?? "null";

              const isLocked =
                arg.event.extendedProps.taskData?.isLocked ||
                arg.event.extendedProps.isLocked ||
                false;

              return (
                <div className={style.dayTaskContainer}>
                  <div
                    className={style.dayTaskLine}
                    style={{
                      backgroundColor: taskColor,
                    }}
                  />
                  <div className={style.eventCard}>
                    <div className={style.eventGroup}>
                      {arg.event.extendedProps.groupName}
                    </div>
                    <div className={style.eventTask}>
                      {arg.event.title}
                      {/*   {arg.event._def.extendedProps.taskData.isOccurrence && (
                        <span className={style.occurrenceBadge}>
                          הרחבה
                        </span>
                      )} */}
                    </div>
                  </div>
                  {isLocked && (
                    <div className={style.lockedIndicator}>
                      <Tooltip title="המשימה תיפתח רק בזמן השיבוץ">
                        <EyeInvisibleOutlined style={{ fontSize: 14 }} />
                      </Tooltip>
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      {selectedTask && (
        <UserTaskModal
          taskId={Number(selectedTask.task_id)}
          completed_at={selectedTask.completed_at}
          task={selectedTask}
          openModal={openUserModal}
          setOpenModal={setOpenUserModal}
          onRefresh={() => {
            const fetchTasks = async () => {
              if (student?.user_id && selectedTeam?.id) {
                const tasks = await getTasksByUser(
                  student.user_id,
                  selectedTeam.id,
                  selectedPermission?.role_code,
                  selectedCourseBatch.id,
                );
                setTasksByUser(tasks || []);
              }
            };
            fetchTasks();
          }}
        />
      )}
    </>
  );
};

export default SimpleCalendar;
