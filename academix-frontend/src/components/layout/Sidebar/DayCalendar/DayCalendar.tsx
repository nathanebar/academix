// Course Gantt sidebar ("גאנט הקורס" on /courseContent): day time grid or queue view.
// Split in issue #102: header in DayCalendarHeader.tsx, event content in DayEventContent.tsx,
// assign / move mutations in useDayCalendarAssign.ts, remove mutations in useDayCalendarRemove.ts,
// pure helpers in dayCalendarEvents.ts.
import React, { useRef, useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import styles from "./DayCalendar.module.css";
import { TeamMembers } from "../../../../types/types";
import {
  useSelectionsStore,
  useRefreshStore,
} from "../../../../store/selectionStore";
import { fetchTeamQueueTasks } from "../../../../services/ApiServices";
import dayjs from "dayjs";
import { useFetchDayTaskAssignement } from "../../../../hooks/useFetchDayTaskAssignement";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { UserTaskModal } from "../../../LazyTaskModals";
import { useBlockedDatesStore } from "../../../../store/blockedDatesStore";
import { useFetchBlockDates } from "../../../../hooks/useFetchBlockDates";
import { usePermissionStore } from "../../../../store/permissionStore";
import QueueView from "../../../QueueView/QueueView";
import { useTeamMembersData } from "../../../../hooks/useHierarchyData";
import { palette } from "../../../../theme/tokens";
import { toCalendarEvents } from "./dayCalendarEvents";
import { useDayCalendarAssign } from "./useDayCalendarAssign";
import { useDayCalendarRemove } from "./useDayCalendarRemove";
import DayEventContent from "./DayEventContent";
import DayCalendarHeader from "./DayCalendarHeader";

interface Props {
  startHour?: string;
  endHour?: string;
  student?: TeamMembers;
  tasksByUser?: Array<unknown>;
  style?: React.CSSProperties;
  date?: Date;
}

export default function DayCalendar({
  startHour,
  endHour,
  style,
  student,
  tasksByUser,
  date,
}: Props) {
  const { triggerRefresh } = useRefreshStore();
  const [eventsAssignement, setEventsAssignement] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const queryClient = useQueryClient();
  const teamMembers = useTeamMembersData();
  const { selectedPermission } = usePermissionStore();
  const {
    selectedTeam,
    activeHeaderType,
    selectedDate,
    selectedTeamMember,
    selectedCourseBatch,
  } = useSelectionsStore();
  useFetchBlockDates(
    selectedTeam?.id,
    selectedCourseBatch?.id,
    selectedPermission?.role_code,
  );
  const { savedBlockFrom, savedBlockTo } = useBlockedDatesStore();

  const [isQueueView, setIsQueueView] = useState(false);

  const realDate = selectedDate?.format("DD/MM/YYYY");

  // Set after an assignment; nothing reads it today (kept from before the split).
  const [, setHoefModalOpen] = useState(false);

  const {
    data: tasksData,
    isError,
    refetch,
  } = useFetchDayTaskAssignement(
    date
      ? dayjs(date).format("YYYY-MM-DD")
      : (selectedDate?.format("YYYY-MM-DD") ?? null),
    selectedTeam?.id ?? -1,
    selectedTeamMember?.id ?? -1,
    activeHeaderType === "teamMember",
    selectedCourseBatch?.id,
  );

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks-day"] });
  }, []);

  const { data: queueData, refetch: refetchQueue } = useQuery({
    queryKey: [
      "team-queue-tasks",
      selectedTeam?.id,
      selectedCourseBatch?.id,
      selectedTeamMember?.id,
    ],
    queryFn: () =>
      fetchTeamQueueTasks(
        selectedTeam?.id ?? 0,
        selectedCourseBatch?.id ?? 0,
        undefined,
        undefined,
        activeHeaderType === "teamMember",
        selectedTeamMember?.id,
      ),
    enabled: isQueueView || !!selectedTeamMember?.id,
  });

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const openBlockModal = () => setIsBlockModalOpen(true);
  const closeBlockModal = () => setIsBlockModalOpen(false);
  const blockedLabel =
    savedBlockFrom && savedBlockTo
      ? ` חסום מתאריך ${savedBlockFrom.format(
          "DD/MM",
        )} - עד ${savedBlockTo.format("DD/MM")}`
      : "חסימת משימות";

  const teamMemberLength: number = useMemo(() => {
    return (
      teamMembers?.filter(
        (tm) => tm.member_role === "STUDENT" && selectedTeam?.id === tm.team_id,
      ).length ?? null
    );
  }, [teamMembers, selectedTeam?.id]);

  const { handleAddEvent, handleUpdateEvent } = useDayCalendarAssign({
    activeHeaderType,
    selectedTeam,
    selectedTeamMember,
    selectedCourseBatch,
    realDate,
    refetch,
    setHoefModalOpen,
  });

  const { handleDragStop, removeTaskMutation, removeAssignMutation } =
    useDayCalendarRemove({
      activeHeaderType,
      selectedTeam,
      selectedTeamMember,
      eventsAssignement,
      setEventsAssignement,
      refetch,
      refetchQueue,
      triggerRefresh,
    });

  const handleEventClick = (arg: any) => {
    const eventId = arg.event.id;
    const selected = tasksData?.find((event: any) => event.id == eventId);

    if (student && selected?.isLocked) {
      notification.warning({
        message: "המשימה נעולה",
        description: "המשימה תהיה זמינה רק בזמן השיבוץ",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    setSelectedTask(selected || null);
  };

  const handleDragStart = () => {
    if (!student) {
      const trashZone = document.getElementById("trash-zone");
      trashZone?.classList.add("active-trash");
    }
  };

  useEffect(() => {
    if (calendarRef.current && date) {
      calendarRef.current.getApi().gotoDate(date);
    } else if (selectedDate && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(selectedDate.toDate());
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isError) return;
    if (!tasksData || !Array.isArray(tasksData)) {
      setEventsAssignement([]);
      return;
    }
    setEventsAssignement(
      toCalendarEvents(tasksData, tasksByUser, activeHeaderType, student),
    );
  }, [tasksData, tasksByUser, isError]);

  const isStudentRole = selectedPermission?.role_code === "STUDENT";

  return (
    <div style={{ height: "55vh", position: "relative", ...style }}>
      {!student && (
        <DayCalendarHeader
          teamName={selectedTeam?.name}
          memberName={selectedTeamMember?.name}
          isQueueView={isQueueView}
          setIsQueueView={setIsQueueView}
          showBlockDates={!isStudentRole}
          isBlockModalOpen={isBlockModalOpen}
          openBlockModal={openBlockModal}
          closeBlockModal={closeBlockModal}
          selectedTeamId={selectedTeam?.id}
          selectedCourseBatchId={selectedCourseBatch?.id}
          blockedLabel={blockedLabel}
        />
      )}
      {isQueueView ? (
        <QueueView
          queueTasks={
            queueData?.data?.map((t: any) => ({
              taskId: t.task_id,
              taskName: t.name,
              taskColor: t.task_color || t.axis_color || palette.antBlue,
              groupName: t.group_name,
              assignmentsCount: t.assignments_count,
              assignments: t.assignments, // ← מערך ההקצאות
              status: "pending",
              timeAgo: t.timeAgo,
              exposure: t.exposure,
              recommendedTime: t.recommendedTime,
              formId: t.formId,
            })) || []
          }
          onRemove={(taskId) => {
            removeTaskMutation.mutate(Number(taskId));
          }}
          onRemoveAssignment={(taskAssignmentId) => {
            removeAssignMutation.mutate(Number(taskAssignmentId));
          }}
        />
      ) : (
        // ======== תצוגת לוח שנה ========
        <FullCalendar
          ref={calendarRef}
          eventDidMount={(info) => {
            // Right click on an event: no browser menu (the custom context menu is disabled for now).
            info.el.addEventListener("contextmenu", (e: MouseEvent) => {
              e.preventDefault();
            });
          }}
          viewClassNames={(view) => {
            if (view.view.type === "timeGridDay") {
              return [styles["my-calendar"]];
            }
            return [];
          }}
          dayCellClassNames={(arg) => {
            const today = new Date();
            const isToday = arg.date.toDateString() === today.toDateString();
            return isToday ? [styles["day-bg"]] : [];
          }}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          timeZone="local"
          initialDate={date ? date : selectedDate?.toDate()}
          dayHeaderContent={(arg) => {
            if (!student)
              return (
                <span className="fc-col-header-cell-cushion">
                  {dayjs(
                    arg.date.toISOString ? arg.date.toISOString() : arg.date,
                  ).format("dddd D/M")}
                </span>
              );
          }}
          scrollTime={
            student
              ? { hours: Math.max(new Date().getHours() - 2, 0) }
              : {
                  hours: new Date().getHours(),
                  minutes: new Date().getMinutes() - 30,
                }
          }
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit" }}
          editable={!isStudentRole && !student}
          droppable={true}
          eventClick={handleEventClick}
          allDayContent={!student}
          allDaySlot={!student}
          height={student ? "75%" : "100%"}
          slotMinTime={"08:00:00"}
          slotMaxTime={"24:00:00"}
          slotDuration="00:15:00"
          headerToolbar={false}
          nowIndicator={true}
          locale="he"
          dropAccept="*"
          direction="rtl"
          events={eventsAssignement}
          eventContent={(arg) => (
            <DayEventContent
              arg={arg}
              startHour={startHour}
              endHour={endHour}
              student={student}
              isStudentRole={isStudentRole}
              activeHeaderType={activeHeaderType}
              teamMemberLength={teamMemberLength}
            />
          )}
          eventReceive={(arg) => {
            handleAddEvent.mutate({
              event: arg.event,
              revert: arg.revert,
            });
          }}
          eventDrop={(info) => {
            handleUpdateEvent.mutate(info.event);
          }}
          eventResize={(info) => {
            handleUpdateEvent.mutate(info.event);
          }}
          eventDragStart={handleDragStart}
          eventDragStop={(arg) => {
            handleDragStop.mutate(arg);
          }}
        />
      )}
      {selectedTask && (
        <UserTaskModal
          taskId={Number(selectedTask.task_id)}
          task={tasksData?.find((t: any) => t.id === selectedTask.id)}
          openModal={selectedTask}
          setOpenModal={setSelectedTask}
          setSelectedEvent={setSelectedTask}
          completed_at={selectedTask?.completed_at}
          onRefresh={() => {
            refetch().then((newTaskData: any) => {
              if (selectedTask?.taskassignmentid) {
                const taskAssignmentId = selectedTask.taskassignmentid;

                const updatedTask = newTaskData?.data?.find(
                  (t: any) => t.taskassignmentid === taskAssignmentId,
                );

                if (updatedTask) {
                  setSelectedTask((prev: any) => ({
                    ...prev,
                    extendedProps: {
                      ...prev.extendedProps,
                      completed_at: updatedTask.completed_at,
                    },
                  }));
                }
              }
            });
          }}
        />
      )}
    </div>
  );
}
