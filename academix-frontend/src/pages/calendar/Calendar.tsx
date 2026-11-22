import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

import {
  Button,
  Card,
  Input,
  Modal,
  notification,
  Popconfirm,
  Tooltip,
  message,
} from "antd";
import interactionPlugin, {
  EventResizeDoneArg,
} from "@fullcalendar/interaction";

import CalendarHeader from "../../components/CalendatHeader/CalendarHeader";
import style from "./Calendar.module.css";

import dayjs, { Dayjs } from "dayjs";
// import "./Calendar.css";
import { HeaderPermissionDisplay } from "../../components/HeaderPermissionDisplay";
import { CalendarApi, DateSelectArg, EventDropArg } from "fullcalendar";

import {
  CalendarFilled,
  PlusOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Assignment,
  FlatTask,
  GroupedTask,
  QueueTask,
  schemaMap,
  viewMode,
  TeamEvent,
  TeamEventAssignment,
} from "../../types/types";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

import { useSelectionsStore } from "../../store/selectionStore";
import { useFetchRangeTaskAssignement } from "../../hooks/useFetchRangeTaskAssignement";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignToProgress,
  assignToTeam,
  assignToTeamNew,
  assignToUser,
  assignToUserNew,
  checkTaskAssignmentExists,
  checkUserTaskAssignmentExists,
  deleteTaskAssignmentOccurrence,
  deleteTaskAssignmentOccurrencesTeam,
  deleteTaskAssignmentTeam,
  deleteTaskAssignmentUser,
  fetchTeamQueueTasks,
  saveHoefsForTask,
  updateOccurrence,
  updateToTeam,
  updateToUser,
} from "../../services/ApiServices";
import { UserTaskModal } from "../../components/LazyTaskModals";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useCalendarStore } from "../../store/calendarStore";
import { usePermissionStore } from "../../store/permissionStore";
import { EventContent } from "./EventContent/EventContent";
import TeamTaskModal from "../../components/TeamTaskModal/TeamTaskModal";
import TaskMembersStatus from "../../components/Modals/TaskMembersStatus/TaskMembersStatus";

import { useTeamEvent, useUpdateTeamEvent } from "../../hooks/useTeamEvent";

import {
  useAddTeamEventAssignments,
  useRemoveTeamEventAssignment,
  useTeamEventAssignment,
  useUpdateTeamEventAssignment,
} from "../../hooks/useFetchTeamEventAssignments";
import TeamEventBank from "./teamEventBank/TeamEventBank";
import { useBlockedDatesStore } from "../../store/blockedDatesStore";
import { useFetchBlockDates } from "../../hooks/useFetchBlockDates";
import TasksQueuePanel from "../TasksQueuePanel/TasksQueuePanel";
import { useQuery } from "@tanstack/react-query";
import {
  useAssignHoef,
  useHoefTeamSummary,
} from "../../hooks/useHoefAssignment";
import { showAssignmentModal } from "../../components/layout/Sidebar/DayCalendar/AssignmentActionModal";
import { showAssignHoefModal } from "../../components/layout/Sidebar/AssignHoefModal";
import CreateTaskFromCalendar from "./CreateTaskFromCalendar/CreateTaskFromCalendar";
import { useCourseBatchStore } from "../../store/courseBatchStore";
import { useTaskGroupsByAxisId } from "../../hooks/useTaskGroupsByAxisId";
import { NewTaskModal } from "../../components/LazyTaskModals";

interface TaskEvent {
  id?: string;
  title: string;
  start: string;
  color: string;
  taskid: number;
  taskDescription: string;
  stage?: string;
  assignedHour: string;
  assignedMinutes: string;
  end: string;
  source: string;
  assignedcount: number;
  completionrate: number;
  totalmembers: number;
  completed: Date | null;
  taskAssignmentId?: string;
  isLocked?: boolean;
  hasExposure?: boolean;
  extendedProps?: any;
}

const MyCalendar: React.FC = () => {
  const [openUserModal, setOpenUserModal] = useState<boolean>(false);
  const [openTaskModal, setOpenTaskModal] = useState<boolean>(false);
  const processedDrops = useRef<Set<string>>(new Set());
  const calanderRef = useRef<FullCalendar | null>(null);

  const [currentDate, setCurrentDate] = useState(dayjs());
  const [openTooltipEvents, setOpenTooltipEvents] = useState<boolean>(false);
  const [selectedUpdateEventModal, setSelectedUpdateEventModal] = useState<{
    type: "drag" | "move";
    info: EventResizeDoneArg | EventDropArg;
  } | null>(null);
  const addTeamEventAssignmentMutation = useAddTeamEventAssignments();

  const assignHoefMutation = useAssignHoef();
  const { viewMode, setViewMode } = useCalendarStore();
  const removeTeamEventAssignmentMutation = useRemoveTeamEventAssignment();
  const updateTeamEventAssignmentMutation = useUpdateTeamEventAssignment();
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const [events, setEvents] = useState<TaskEvent[]>([]);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedAssignmentForNote, setSelectedAssignmentForNote] =
    useState<any>(null);
  const [noteText, setNoteText] = useState("");

  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );

  const {
    selectedTeam,
    activeHeaderType,
    selectedDate,
    selectedTeamMember,
    selectedCourseBatch,
    setSelectedDate,
    setActiveHeaderType,
  } = useSelectionsStore();

  // useEffect(() => {
  //   if (selectedPermission?.role_code !== "STUDENT") {
  //     setActiveHeaderType("team");
  //   } else {
  //     setActiveHeaderType("teamMember");
  //   }
  // }, [selectedPermission?.role_code]);

  const realDate = selectedDate?.format("DD/MM/YYYY");
  const { filteredCourseBatches, filteredTeamMembers, filteredTeams } =
    useFilteredDataStore();
  const [displayMode, setDisplayMode] = useState<"full" | "split">("full");
  const { isFetched } = useFetchBlockDates(
    selectedTeam?.id,
    selectedCourseBatch?.id,
    selectedPermission?.role_code
  );
  const { data: teamEvents = [] } = useTeamEvent();
  const {
    data: teamEventAssignments = [],
    refetch: refetchTeamEventAssingments,
  } = useTeamEventAssignment();
  const updateTeamEventMutation = useUpdateTeamEvent();
  const { savedBlockFrom, savedBlockTo } = useBlockedDatesStore();
  const isStudent = selectedPermission?.role_code === "STUDENT";

  useEffect(() => {
    if (selectedDate && calanderRef.current) {
      const api = calanderRef.current.getApi();
      if (api) {
        api.gotoDate(selectedDate.toDate());

        setCurrentDate(dayjs(selectedDate));
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      setViewMode("timeGridDay");
    };
  }, []);

  const handleAddTeamEventAssingment = useCallback(
    async (data: any) => {
      const dropKey = `${data.TeamEventId}_${data.start.getTime()}`;

      if (processedDrops.current.has(dropKey)) {
        return;
      }
      processedDrops.current.add(dropKey);

      try {
        await addTeamEventAssignmentMutation.mutateAsync(data);
        await refetchTeamEventAssingments();
      } finally {
        setTimeout(() => {
          processedDrops.current.delete(dropKey);
        }, 1000);
      }
    },
    [addTeamEventAssignmentMutation]
  );
  const generateConstantTeamEvent = (
    start: Date,
    end: Date,
    startHour: number,
    endHour: number,
    teamEventAssignment: Omit<TeamEventAssignment, "id">,
    days: number[]
  ) => {
    for (
      let day = new Date(start).getTime();
      day <= new Date(end).getTime()+ 86400000;
      day += 86400000
    ) {
      if (days.includes((dayjs(day).day()+1) % 7) ) {
        handleAddTeamEventAssingment({
          TeamEventId: teamEventAssignment.TeamEventId,
          start: dayjs(day)
            .set("hours", startHour / 60)
            .set("minutes", startHour % 60)
            .toDate(),
          end: dayjs(day)
            .set("hours", endHour / 60)
            .set("minutes", endHour % 60)
            .toDate(),
        });
      }
    }
  };
  const generateDateRange = (date: dayjs.Dayjs, view: viewMode) => {
    let d = dayjs();
    if (view === "dayGridMonth") {
      // only to request make the range to 1 month more when i click on month display
      const nextMonth = currentDate.add(1, "month");
      const firstDayOfNextMonth = nextMonth.startOf("month");
      d = firstDayOfNextMonth;
    }

    switch (view) {
      case "dayGridMonth":
        const startOfMonth = date.startOf("month");
        const endOfMonth = d.endOf("month").add(1, "day");
        return {
          startDate: startOfMonth.format("YYYY-MM-DD"),
          endDate: endOfMonth.format("YYYY-MM-DD"),
        };

      case "timeGridWeek":
        const startOfWeek = date.startOf("week");
        const endOfWeek = date.endOf("week").add(1, "day");
        return {
          startDate: startOfWeek.format("YYYY-MM-DD"),
          endDate: endOfWeek.format("YYYY-MM-DD"),
        };

      case "timeGridDay":
        return {
          startDate: date.format("YYYY-MM-DD"),
          endDate: date.add(1, "day").format("YYYY-MM-DD"),
        };

      case "twoWeeks":
        const startTwoWeeks = date.startOf("week");
        const endTwoWeeks = startTwoWeeks.add(1, "week").endOf("week");
        return {
          startDate: startTwoWeeks.format("YYYY-MM-DD"),
          endDate: endTwoWeeks.format("YYYY-MM-DD"),
        };

      default:
        const startDefault = date.startOf("month");
        const endDefault = date.endOf("month").add(1, "day");
        return {
          startDate: startDefault.format("YYYY-MM-DD"),
          endDate: endDefault.format("YYYY-MM-DD"),
        };
    }
  };

  function is21to20NextDay(str: string) {
    // Parsing: "26_2026-05-10T21:00:00Z_2026-05-11T20:00:00Z"
    const parts = str.split("_");

    if (parts.length < 3) return false;

    const startDate = new Date(parts[1]);
    const endDate = new Date(parts[2]);

    const startHour = startDate.getUTCHours();
    const endHour = endDate.getUTCHours();

    return startHour === 21 && endHour === 18;
  }

  const isAllDay = (start: string, end: string) => {
    const startHour = dayjs(start).hour();
    const endHour = dayjs(end).hour();

    return startHour === 0 && endHour === 21;
  };
  const { startDate, endDate } = generateDateRange(currentDate, viewMode);

  const { data: tasksData, refetch } = useFetchRangeTaskAssignement(
    startDate,
    endDate,
    selectedTeam?.id ?? -1,
    selectedTeamMember?.id ?? -1,
    activeHeaderType === "teamMember",
    selectedCourseBatch?.id
  );

  const {
    data: queueData,
    isLoading: isQueueLoading,
    refetch: refetchQueue,
  } = useQuery({
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
        selectedTeamMember?.id
      ),
    enabled: displayMode == "split",
  });

  useEffect(() => {
    if (!tasksData || !Array.isArray(tasksData)) {
      setEvents([]);
      return;
    }

    const transformedEvents: any[] = tasksData.flatMap((task) => {
      if (activeHeaderType !== "teamMember") {
        const g = task as GroupedTask;

        const eventId = g.id;

        // ולידציה - בדוק שהתאריכים תקינים
        const startDate = g?.start ? dayjs(g.start) : null;
        const endDate = g?.end ? dayjs(g.end) : null;

        // אם אין תאריך תקין, דלג על המשימה
        if (!startDate?.isValid() || !endDate?.isValid()) {
          console.warn("Invalid dates for task:", g.name, g.id);
          return []; // או return null
        }

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        const now = new Date();
        const start = new Date(g.start);
        const isExposure = g.exposure === true;
        const isLocked = isExposure && now < start;

        return {
          id: eventId,
          title: g.name,
          start: startISO,
          end: endISO,
          allDay: isAllDay(startISO, endISO),
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: "black",
          isLocked: isLocked,
          hasExposure: isExposure,
          extendedProps: {
            groupName: g.gn,
            taskColor: g.tcolor,
            orgtaskColor: g.tcolor,
            axisColor: g.color,
            task_id: g.task_id,
            taskassignmentid: g.items.map((t) => t.taskAssignmentId),
            assignedCount: g.assignedCount,
            totalMembers: g.totalMembers,
            completionRate: g.completionRate,
            status: g.status,
            items: g.items,
            source: g.items?.[0]?.source,
            creatorName: g.creatorName,
            creatorUsername: g.creatorUsername,
            assignedByName: g.assignedByName,
            is_scheduled: g.is_scheduled,
            start_minutes_before: g.start_minutes_before,
            end_minutes_after: g.end_minutes_after,
            isLocked: isLocked,
            hasExposure: isExposure,
          },
        };
      }

      const f = task as FlatTask;

      const startISO = dayjs(f.most_frequent_assigned_at_start).toISOString();
      const endISO = dayjs(f.most_frequent_assigned_at_end).toISOString();

      const now = new Date();
      const startTime = new Date(f.most_frequent_assigned_at_start);
      const isExposure = f.exposure === true;
      const isLocked = isExposure && now < startTime;

      return {
        id: f.id,
        title: f.name,
        start: startISO,
        end: endISO,
        allDay: isAllDay(startISO, endISO),
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: "black",
        isLocked: isLocked,
        hasExposure: isExposure,
        extendedProps: {
          groupName: f.gn,
          taskColor: f.tcolor,
          orgtaskColor: f.tcolor,
          axisColor: f.color,
          source: f.source,
          status: f.status,
          creatorName: f.creatorName,
          creatorUsername: f.creatorUsername,
          assignedByName: f.assignedByName,
          completed_at: f.completed_at,
          completed: f.completed,
          taskassignmentid: f.taskassignmentid,
          task_id: f.task_id,
          is_scheduled: f.is_scheduled,
          start_minutes_before: f.start_minutes_before,
          end_minutes_after: f.end_minutes_after,
          isLocked: isLocked,
          hasExposure: isExposure,
          notRequiredToSubmit: f.notRequiredToSubmit,
          occurrence_id: f?.occurrence_id,
          has_hoef: f.has_hoef,
          hoef_name: f.hoef_name,
          hoef_username: f.hoef_username,
          hoef_image_url: f.hoef_image_url,
          hoef_team_member_id: f.hoef_team_member_id,
          student_name: f.student_name,
          student_username: f.student_username,
        },
      };
    });

    setEvents(transformedEvents);
  }, [tasksData, activeHeaderType]);

  useEffect(() => {
    const api = getApi();
    if (api) {
      setTimeout(() => {
        api.changeView(viewMode);
      }, 0);
    }
  }, [viewMode]);

  const getApi = (): CalendarApi | null =>
    calanderRef.current ? calanderRef.current.getApi() : null;

  const handleNext = () => {
    const api = getApi();
    if (api) {
      api.next();
      setCurrentDate(dayjs(api.getDate()));
      setSelectedDate(dayjs(api.getDate()));
    }
  };
  const handleToday = () => {
    const api = getApi();
    if (api) {
      api.today();
      setCurrentDate(dayjs(api.getDate()));
    }
  };
  const handlePrev = () => {
    const api = getApi();
    if (api) {
      api.prev();
      setCurrentDate(dayjs(api.getDate()));
      setSelectedDate(dayjs(api.getDate()));
    }
  };
  const handleChangeView = (view: viewMode) => {
    setViewMode(view);
  };

  const handleEventClick = (arg: any) => {
    const eventId = arg.event.id;
    const selected: any = events?.find((event) => event.id == eventId);

    const isLocked =
      arg.event.extendedProps?.isLocked ||
      selected?.isLocked ||
      selected?.extendedProps?.isLocked;

    if (isStudent && isLocked) {
      notification.warning({
        message: "המשימה נעולה",
        description: "המשימה תהיה זמינה רק בזמן השיבוץ",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    setSelectedEvent(selected || null);

    if (arg.event.extendedProps?.TeamEventId) {
      setSelectedAssignmentForNote({
        id: arg.event.id,
        teamMemberId: arg.event.extendedProps.teamMemberId ?? null,
        note: arg.event.extendedProps.note ?? "",
      });
      setNoteText(arg.event.extendedProps.note ?? "");
      setIsNoteModalOpen(true);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedAssignmentForNote) return;

    updateTeamEventAssignmentMutation.mutate(
      {
        id: selectedAssignmentForNote.id,
        note: noteText,
      } as TeamEventAssignment,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["teamEventAssignments"] });
          setIsNoteModalOpen(false);
          setSelectedAssignmentForNote(null);
        },
        onError: () => {
          notification.error({ message: "Error in save" });
        },
      }
    );
  };

  const handleTaskClick = (task: QueueTask) => {    
    const transformedTask = {
      id: task.task_id, // או task.group_id אם צריך
      title: task.name,
      // start: task.most_frequent_assigned_at_start || new Date().toISOString(),
      // end: task.most_frequent_assigned_at_end || new Date().toISOString(),
      allDay: false,
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: "black",
      isLocked: false,
      hasExposure: task.hasExposure || task.exposure || false,
      extendedProps: {
        groupName: task.group_name,
        taskColor: task.task_color,
        orgtaskColor: task.task_color,
        axisColor: task.axis_color,
        task_id: task.task_id,
        // ✅ המרת assignments ל-items
        items:
          task.assignments?.map((assignment: any) => ({
            id: assignment.taskAssignmentId,
            taskAssignmentId: assignment.taskAssignmentId,
            occurrence_id: null,
            source: "assignment",
            user_id: assignment.user_id,
            memberName: assignment.memberName,
            memberUsername: assignment.memberUsername,
          })) || [],
        source: "assignment",
        status: task.status,
        assignedCount: task.assignments_count,
        completionRate: 0,
        creatorName: null,
        creatorUsername: null,
        assignedByName: null,
        is_scheduled: false,
        start_minutes_before: null,
        end_minutes_after: null,
        hasExposure: task.hasExposure || task.exposure || false,
        notRequiredToSubmit: task.notRequiredToSubmit,
        recommendedTime: task.recommendedTime,
      },
    };

    setOpenTaskModal(true);
    setSelectedEvent(transformedTask);
  };

  const calendarRef = useRef<FullCalendar>(null);
  const queryClient = useQueryClient();

  const [openWizard, setOpenWizard] = useState(false);
  const [wizardSelectedDate, setWizardSelectedDate] = useState<
    Date | undefined
  >(undefined);
  const [wizardSelectedStartTime, setWizardSelectedStartTime] = useState<
    string | undefined
  >(undefined);
  const [wizardSelectedEndTime, setWizardSelectedEndTime] = useState<
    string | undefined
  >(undefined);

  const [openNewTaskModal, setOpenNewTaskModal] = useState(false);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const { start, end } = selectInfo;

    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    };

    setWizardSelectedDate(start);
    setWizardSelectedStartTime(formatTime(start));
    setWizardSelectedEndTime(formatTime(end));

    setOpenWizard(true);

    selectInfo.view.calendar.unselect();
  };

  const handleWizardClose = () => {
    setOpenWizard(false);
    setWizardSelectedDate(undefined);
    setWizardSelectedStartTime(undefined);
    setWizardSelectedEndTime(undefined);
  };

  const handleWizardCancel = () => {
    setOpenWizard(false);
  };

  const handleTaskCreated = () => {
    setOpenWizard(false);
    setWizardSelectedDate(undefined);
    setWizardSelectedStartTime(undefined);
    setWizardSelectedEndTime(undefined);
    refetch();
  };

  const handleAddEvent = useMutation({

    
  mutationFn: async (event: any) => {
  const isQueueTask = event.extendedProps?.isQueueTask ?? false;

  // ✅ תיקון: קורא לשדה הנכון — recommendedTime (ולא endStr)
  const recommendedMinutes = event?.extendedProps?.recommendedTime ?? 60;
  const hours = recommendedMinutes / 60 || 1;



  const computedEnd = () =>
    event.allDay
      ? dayjs(event.start).add(21, "hour").toDate()
      : dayjs(event.start).add(hours, "hour").toDate();

  // ✅ ה-end הסופי: אם יש לאירוע end אמיתי — משתמשים בו, אחרת מחשבים
  const end = event.end ?? computedEnd();

  if (activeHeaderType === "team" && selectedTeam) {
    const hasExisting = await checkTaskAssignmentExists(event.id, selectedTeam.id);

    if (hasExisting) {
      const action = await showAssignmentModal("team");
      if (!action) return;

      const res =
        action === "expand"
          ? await assignToTeam(
              event.id,
              selectedTeam.id,
              event.start,
              end,               // ✅
              selectedCourseBatch?.id,
              realDate,
              isQueueTask
            )
          : await assignToTeamNew(
              event.id,
              selectedTeam.id,
              event.start,
              end,               // ✅
              selectedCourseBatch?.id,
              realDate
            );

      await handleAssignmentResponse(res);
    } else {
      const res = await assignToTeam(
        event.id,
        selectedTeam.id,
        event.start,
        end,                     // ✅
        selectedCourseBatch?.id,
        realDate,
        isQueueTask
      );
      await handleAssignmentResponse(res);
    }
  } else if (
    activeHeaderType === "teamMember" &&
    selectedTeamMember &&
    selectedTeam
  ) {
    const hasExisting = await checkUserTaskAssignmentExists(
      event.id,
      selectedTeam.id,
      selectedTeamMember.id
    );
    const memberId = selectedTeamMember.id ?? -1;

    if (hasExisting) {
      const action = await showAssignmentModal("teamMember");
      if (!action) return;

      const res =
        action === "expand"
          ? await assignToUser(
              event.id,
              selectedTeam.id,
              memberId,
              event.start,
              end,               // ✅
              selectedCourseBatch?.id
            )
          : await assignToUserNew(
              event.id,
              selectedTeam.id,
              memberId,
              event.start,
              end,               // ✅
              selectedCourseBatch?.id
            );

      await assignToProgress(res.data);
    } else {
      const res = await assignToUser(
        event.id,
        selectedTeam.id,
        memberId,
        event.start,
        end,                     // ✅
        selectedCourseBatch?.id
      );
      await assignToProgress(res.data);

      if (event) {
        const assignHoef = await showAssignHoefModal(
          {
            taskId: event.id,
            teamId: selectedTeam.id,
            taskName: event?.title,
          
          },
          queryClient
        );

        if (assignHoef) {
          await assignHoefMutation.mutateAsync({
            taskAssignmentId: res?.data?.task_assignment_id,
            team_member_id: assignHoef.hoefId,
            deadline: end,        // ✅ באם זה למה הכוונה — אחרת השאר null
          });

          message.success("המשימה שובצה לחופף בהצלחה!");
        }
      }
    }
  }

  await refetch();
},

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
      queryClient.refetchQueries({ queryKey: ["task-users"] });
      queryClient.invalidateQueries({
        queryKey: ["assignments-completed-by-team"],
      });
      queryClient.invalidateQueries({ queryKey: ["tasks-range"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-team-day"] });
      queryClient.invalidateQueries({ queryKey: ["tasksByColor"] });
      queryClient.invalidateQueries({ queryKey: ["tasksByTag"] });
      queryClient.invalidateQueries({ queryKey: ["tasksByGradeStage"] });
      queryClient.invalidateQueries({ queryKey: ["surveyDashboard"] });
    },
  });

  const handleAssignmentResponse = async (assId: any) => {
    if (assId?.data?.new_assignment_ids?.length) {
      // setHoefModalOpen(true);
    }

    await assignToProgress({
      task_id: assId.data?.task_id,
      task_assignment_id: assId.data.new_assignment_ids,
    });
  };

  const handleUpdateEvent = useMutation({
    mutationFn: async (event: any) => {
      if (activeHeaderType === "team") {
        if (event.extendedProps.items?.[0].source === "assignment") {
          event.extendedProps.items.map(async (it: any) => {
            await updateToUser(
              it.taskAssignmentId,
              event.start,
              event.allDay
                ? dayjs(event.start).add(21, "hour").toDate()
                : is21to20NextDay(event.id)
                ? dayjs(event.start).add(1, "hour").toDate()
                : event.end
            );
            await refetch();
          });
        } else {
          event.extendedProps.items.map(async (it: any) => {
            await updateOccurrence(
              it.occurrence_id,
              event.start,
              is21to20NextDay(event.id)
                ? dayjs(event.start).add(21, "hour").toDate()
                : event.allDay
                ? dayjs(event.start).add(1, "hour").toDate()
                : event.end
            );
            await refetch();
          });
        }

        <Popconfirm
          title="האם אתה בטוח שברצונך למחוק את קורס?"
          description="פעולה זו לא ניתנת לביטול"
          onConfirm={async () =>
            await updateToTeam(
              event.id,
              selectedTeam.id,
              event.start,
              event.end
            )
          }
          okText="כן, מחק"
          cancelText="ביטול"
          placement="bottom"
        >
          <div style={{ color: "red" }}>מחיקה</div>
        </Popconfirm>;
      } else if (activeHeaderType === "teamMember" && selectedTeamMember) {
        if (event.extendedProps.source === "assignment") {
          await updateToUser(
            event.extendedProps.taskassignmentid,
            event.start,
            event.allDay
              ? dayjs(event.start).add(21, "hour").toDate()
              : is21to20NextDay(event.id)
              ? dayjs(event.start).add(1, "hour").toDate()
              : event.end
          );
        } else {
          await updateOccurrence(
            Number(event.extendedProps?.occurrence_id),
            event.start,
            event.allDay
              ? dayjs(event.start).add(21, "hour").toDate()
              : is21to20NextDay(event.id)
              ? dayjs(event.start).add(1, "hour").toDate()
              : event.end
          );
        }
      }
      await refetch();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });
    },
  });

  const handleDragStart = (info: any) => {
    const trashZone = document.getElementById("trash-zone");
    trashZone?.classList.add("active-trash");
  };

  const handleDragStop = useMutation({
    onMutate: async (info: any) => {
      
      await queryClient.cancelQueries({ queryKey: ["group-tasks"] });

      const previousEvents = [...events]; // שמור מצב קודם

      return { previousEvents };
    },

    mutationFn: async (info: any) => {
      // בדיקת אם הגיע לפח
      const trashZone = document.getElementById("trash-zone");
      trashZone?.classList.remove("active-trash");
      const trashRect = trashZone?.getBoundingClientRect();
      const { clientX, clientY } = info.jsEvent;

      const inTrash =
        trashRect &&
        clientX >= trashRect?.left &&
        clientX <= trashRect.right &&
        clientY >= trashRect.top &&
        clientY <= trashRect.bottom;

      if (!inTrash) {
        return { status: "not_in_trash" };
      }

      // בדיקת הרשאת תלמיד
      if (selectedPermission?.role_code === "STUDENT") {
        notification.warning({
          message: <span style={{ fontWeight: 700 }}>אין הרשאה</span>,
          description: (
            <div style={{ lineHeight: 1.6, direction: "rtl" }}>
              <ExclamationCircleOutlined
                style={{ color: "#faad14", marginLeft: 8 }}
              />
              <span>פנה לצוות החופפים: </span>
              <strong style={{ color: "#faad14" }}>
                {info.event.extendedProps.creatorName} -{" "}
                {info.event.extendedProps.creatorUsername}
              </strong>
            </div>
          ),
          placement: "topRight",
          duration: 4,
        });
        return { status: "permission_denied" };
      }

      // טיפול במחיקה עם אישור
      const result = await new Promise<{ status: "confirmed" | "cancelled" }>(
        (resolve) => {
          if (activeHeaderType === "teamMember" && selectedTeamMember) {
            handleTeamMemberDelete(info, resolve);
          } else if (activeHeaderType === "team") {
            handleTeamDelete(info, resolve);
          } else {
            resolve({ status: "cancelled" });
          }
        }
      );

      return result;
    },

    onError: (err, info, context) => {
      if (context?.previousEvents) {
        setEvents(context.previousEvents);
      }
      message.error("המחיקה נכשלה");
    },

    onSuccess: (result, info) => {
      if (
        result?.status === "cancelled" ||
        result?.status === "not_in_trash" ||
        result?.status === "permission_denied"
      ) {
        return;
      }

      // הסר מה-UI מיידית
      setEvents((prev) => prev.filter((e) => e.id !== info.event.id));
    },
  });

  // ============== פונקציות עזר ==============

  const handleTeamMemberDelete = (
    info: any,
    resolve: (r: { status: "confirmed" | "cancelled" }) => void
  ) => {
    if (!info.event.id.includes("T")) {
      removeTeamEventAssignmentMutation.mutate(info.event.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["teamEventsAssignment"] });
          resolve({ status: "confirmed" });
        },
      });
    } else if (info.event.extendedProps.source === "assignment") {
      Modal.confirm({
        title: "? האם אתה בטוח",
        content: "המחיקה תסיר את כל המופעים מהתלמיד",
        okText: "כן, מחק",
        cancelText: "ביטול",
        onOk: async () => {
          await deleteTaskAssignmentUser(
            info.event.extendedProps.taskassignmentid
          );
          await refetch();
          queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
          queryClient.refetchQueries({
            queryKey: ["hoefs", "team", selectedTeam?.id],
          });

          resolve({ status: "confirmed" });
        },
        onCancel: () => resolve({ status: "cancelled" }),
      });
    } else {
      Modal.confirm({
        title: "? האם אתה בטוח",
        content: "המחיקה תסיר את כל המופעים מהתלמיד",
        okText: "כן, מחק",
        cancelText: "ביטול",
        onOk: async () => {
          await deleteTaskAssignmentOccurrence(
            info.event.extendedProps.occurrence_id
          );
          await refetch();
          queryClient.refetchQueries({
            queryKey: ["hoefs", "team", selectedTeam?.id],
          });
          queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
          resolve({ status: "confirmed" });
        },
        onCancel: () => resolve({ status: "cancelled" }),
      });
    }
  };

  const handleTeamDelete = (
    info: any,
    resolve: (r: { status: "confirmed" | "cancelled" }) => void
  ) => {
    if (!info.event.id.includes("T")) {
      removeTeamEventAssignmentMutation.mutate(info.event.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["teamEventsAssignment"] });
          queryClient.refetchQueries({
            queryKey: ["hoefs", "team", selectedTeam?.id],
          });
          resolve({ status: "confirmed" });
        },
      });
    } else if (info.event.extendedProps.items?.[0]?.source === "occurrence") {
      const items = info.event.extendedProps.items;
      Modal.confirm({
        title: "? האם אתה בטוח",
        content: `המחיקה תסיר ${items.length} פריטים`,
        okText: "כן, מחק",
        cancelText: "ביטול",
        onOk: async () => {
          for (const it of items) {
            await deleteTaskAssignmentOccurrencesTeam(
              Number(it.occurrence_id),
              selectedTeam.id
            );
          }
          await refetch();
          queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
          resolve({ status: "confirmed" });
        },
        onCancel: () => resolve({ status: "cancelled" }),
      });
    } else {
      Modal.confirm({
        title: "? האם אתה בטוח",
        content: "המחיקה תסיר את כל המופעים מכל התלמידים שהמשימה הוקצתה להם",
        okText: "כן, מחק",
        cancelText: "ביטול",
        onOk: async () => {
          await deleteTaskAssignmentTeam(
            Number(info.event.extendedProps.task_id),
            selectedTeam.id,
            info?.event?.extendedProps?.items?.map((item: any) => item?.id)
          );
          await refetch();
          queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
          queryClient.refetchQueries({
            queryKey: ["hoefs", "team", selectedTeam?.id],
          });

          resolve({ status: "confirmed" });
        },
        onCancel: () => resolve({ status: "cancelled" }),
      });
    }
  };

  useEffect(() => {
    if (selectedDate && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(selectedDate.toDate());
    }
  }, [selectedDate]);

  const handleOpenTaskStatusModal = (task: any) => {
    setOpenUserModal(true);
  };
  const handleOpenTaskModal = () => {
    setOpenTaskModal(true);
  };

  const handleAssignmentClick = (task: QueueTask, assignment: Assignment) => {

    const eventId = task?.task_id;
    const startISO = assignment.start
      ? dayjs(assignment.start).toISOString()
      : new Date().toISOString();
    const endISO = assignment.end
      ? dayjs(assignment.end).toISOString()
      : new Date().toISOString();

    const now = new Date();
    const start = assignment.start ? new Date(assignment.start) : new Date();
    const isExposure = task.exposure === true;
    const isLocked = isExposure && now < start;

    const transformedEvent = {
      id: eventId,
      title: task.name,
      start: startISO,
      end: endISO,
      allDay: false,
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: "black",
      isLocked: isLocked,
      hasExposure: isExposure,
      task_assignment_id: assignment.taskAssignmentId,

      extendedProps: {
        // ✅ מידע על הקבוצה/ציר
        groupName: task.group_name,
        taskColor: task.task_color,
        orgtaskColor: task.task_color,
        axisColor: task.axis_color,
        // isQueueTask: task.isQueueTask,
        // ✅ מידע על המשימה
        task_id: task.task_id,
        taskassignmentid: [assignment.taskAssignmentId], // מערך כמו בטבלה
        status: task.status,
        source: "assignment",
        creatorName: task.creatorName,
        creatorUsername: task.creatorUsername,
        assignedByName: task.assignedByName || null,
        is_scheduled: task.is_scheduled,
        start_minutes_before: task.start_minutes_before,
        end_minutes_after: task.end_minutes_after,
        isLocked: isLocked,
        hasExposure: isExposure,
        notRequiredToSubmit: task.notRequiredToSubmit,
        recommendedTime: task.recommendedTime,
        isQueueTask: assignment.isQueueTask,
        // ✅ מידע על ה-Form
        formId: task.formId,
        feedbackId: task.feedbackId,
        surveyId: task.surveyId,

        items: [
          {
            id: assignment.taskAssignmentId,
            taskAssignmentId: assignment.taskAssignmentId,
            occurrence_id: null,
            source: "assignment",
            user_id: assignment.user_id,
            memberName: assignment.memberName,
            memberUsername: assignment.memberUsername,
            completed: assignment.completed,
            completed_at: assignment.completed_at,
            name: assignment.name,
            isQueueTask: assignment.isQueueTask,
            max_score: assignment.max_score,
            form_score: assignment.form_score,
            form_completed_at: assignment.form_completed_at,
            form_started_at: assignment.form_started_at,
            scorePercentage: assignment.scorePercentage,
          },
        ],
        max_score: assignment.max_score,
        scorePercentage: assignment.scorePercentage,
        form_score: assignment.form_score,
        form_completed_at: assignment.form_completed_at,
        form_started_at: assignment.form_started_at,
        completed: assignment.completed,
        completed_at: assignment.completed_at,
      },
    };

    setSelectedEvent(transformedEvent);
    setOpenUserModal(true);
  };

  const [wizardSelectedTaskGroupId, setWizardSelectedTaskGroupId] = useState<
    number | undefined
  >(undefined);
  const [wizardSelectedAxisId, setWizardSelectedAxisId] = useState<
    number | undefined
  >(undefined);
  const [wizardSelectedAxisColor, setWizardSelectedAxisColor] = useState<
    string | undefined
  >(undefined);
  const wizardDataRef = useRef({
    date: undefined as Date | undefined,
    startTime: undefined as string | undefined,
    endTime: undefined as string | undefined,
  });
  const handleWizardStep1Complete = (
    taskGroupId: number,
    axisId: number,
    axisColor: string,
    selectedDate?: Date,
    selectedStartTime?: string,
    selectedEndTime?: string
  ) => {
    setWizardSelectedTaskGroupId(taskGroupId);
    setWizardSelectedAxisId(axisId);
    setWizardSelectedAxisColor(axisColor);

    wizardDataRef.current = {
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
    };
    setOpenNewTaskModal(true);
  };

  const buildDateTime = (date: Date | undefined, timeStr?: string): Date => {
    if (!date) return new Date();

    const d = new Date(date);

    if (timeStr) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      d.setHours(hours, minutes, 0, 0);
    } else {
      d.setHours(8, 0, 0, 0);
    }

    return d;
  };
  const handleNewTaskCreated = (data: any) => {
    const {
      date: savedDate,
      startTime: savedStartTime,
      endTime: savedEndTime,
    } = wizardDataRef.current;
    if (savedDate) {
      const eventToSchedule = {
        id: data.id,
        title: data.name,
        start: buildDateTime(savedDate, savedStartTime),
        end: savedEndTime
          ? buildDateTime(savedDate, savedEndTime)
          : dayjs(savedDate).add(1, "hour").toDate(),
        allDay: false,
        extendedProps: {
          isQueueTask: false,
          endStr: data.recommendedTime || 60,
        },
      };

      handleAddEvent.mutate(eventToSchedule, {
        onSuccess: () => {
          // ✅ איפוס רק אחרי הצלחה
          setOpenNewTaskModal(false);
          setWizardSelectedTaskGroupId(undefined);
          setWizardSelectedAxisId(undefined);
          setWizardSelectedAxisColor(undefined);
          setWizardSelectedDate(undefined);
          setWizardSelectedStartTime(undefined);
          setWizardSelectedEndTime(undefined);
          setOpenWizard(false);
          refetch();
          message.success("המשימה נוצרה ושובצה בהצלחה!");
        },
        onError: () => {
          // ✅ איפוס גם במקרה של כישלון
          setOpenNewTaskModal(false);
          setWizardSelectedTaskGroupId(undefined);
          setWizardSelectedAxisId(undefined);
          setWizardSelectedAxisColor(undefined);
          setWizardSelectedDate(undefined);
          setWizardSelectedStartTime(undefined);
          setWizardSelectedEndTime(undefined);
          setOpenWizard(false);
          message.error("המשימה נוצרה אך השיבוץ נכשל");
        },
      });
    } else {
      // אין תאריך - רק איפוס והודעה
      setOpenNewTaskModal(false);
      setWizardSelectedTaskGroupId(undefined);
      setWizardSelectedAxisId(undefined);
      setWizardSelectedAxisColor(undefined);
      setWizardSelectedDate(undefined);
      setWizardSelectedStartTime(undefined);
      setWizardSelectedEndTime(undefined);
      setOpenWizard(false);
      message.success("המשימה נוצרה בהצלחה!");
      refetch();
    }
  };

  const [selectedTask, setSelectedTask] = useState<any>(null);

  const filteredDataOfTeamMemberStudent = filteredTeamMembers?.filter(
    (item) => item.member_role !== "TEAM_COMMANDER"
  );

  const { axisBatchArchive } = useCourseBatchStore();

  const filterAxisBatchArchive = axisBatchArchive?.filter(
    (axis) => axis.team_id == null || axis.team_id === selectedTeam?.id
  );

  const axisIds = useMemo(
    () => new Set(filterAxisBatchArchive?.map((a) => a.id)),
    [filterAxisBatchArchive]
  );

  const { data: groupTasksR } = useTaskGroupsByAxisId(
    axisBatchArchive.map((axis: any) => axis?.id),
    selectedCourseBatch?.id,
    "operational"
  );
  const groupTasks = groupTasksR?.["operational"];

  /*   const filteredTaskGroupsByAxis = filteredTaskGroups?.filter((tg) =>
    axisIds.has(tg.axisId)
  ); */

  const axes = [
    { id: 1, name: "ציר הכשרה", color: "#1890ff" },
    { id: 2, name: "ציר שדה", color: "#52c41a" },
    { id: 3, name: "ציר מבדקים", color: "#faad14" },
  ];

  const taskGroups = [
    { id: 1, name: "תרגול מעשי", axis_id: 1, color: "#1890ff" },
    { id: 2, name: "הרצאות", axis_id: 1, color: "#1890ff" },
    { id: 3, name: "סיורים", axis_id: 2, color: "#52c41a" },
    { id: 4, name: "תרגילי שטח", axis_id: 2, color: "#52c41a" },
    { id: 5, name: "בחינות", axis_id: 3, color: "#faad14" },
  ];

  if (!filteredCourseBatches || filteredCourseBatches.length === 0) {
    return (
      <>
        <div
          style={{
            direction: "rtl",
            display: "flex",
            justifyContent: "space-between",
            alignContent: "center",
          }}
        >
          <HeaderPermissionDisplay />
        </div>
        <div style={{ padding: 30, direction: "rtl", fontSize: 25 }}>
          אין מחזורים זמינים
        </div>
        ;
      </>
    );
  }

  if (
    !filteredDataOfTeamMemberStudent ||
    filteredDataOfTeamMemberStudent.length === 0
  ) {
    return (
      <>
        <div
          style={{
            direction: "rtl",
            display: "flex",
            justifyContent: "space-between",
            alignContent: "center",
          }}
        >
          <HeaderPermissionDisplay />
        </div>

        {selectedTeam ? (
          <div style={{ fontSize: 30, direction: "rtl", padding: 10 }}>
            אין חיילים בצוות{" "}
          </div>
        ) : filteredTeams?.length > 0 ? (
          <div style={{ padding: 30, direction: "rtl", fontSize: 25 }}>
            יש לבחור צוות{" "}
          </div>
        ) : (
          <div style={{ padding: 30, direction: "rtl", fontSize: 25 }}>
            אין צוותים{" "}
          </div>
        )}
      </>
    );
  }

  if (
    activeHeaderType == "domain" ||
    activeHeaderType == "course" ||
    activeHeaderType == "courseBatches"
  ) {
    return (
      <>
        <div
          style={{
            direction: "rtl",
            display: "flex",
            justifyContent: "space-between",
            alignContent: "center",
          }}
        >
          <HeaderPermissionDisplay />
        </div>

        <div style={{ padding: 30, direction: "rtl", fontSize: 25 }}>
          יש לבחור צוות{" "}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          direction: "rtl",
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
        }}
      >
        <HeaderPermissionDisplay />
      </div>

      <div className={style.warper}>
        {/* Header עם הסוויץ */}
        <CalendarHeader
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onChangeView={handleChangeView}
          activeViewMode={viewMode}
          currentDate={currentDate}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
        />

        {/* תוכן לפי מצב */}
        {displayMode === "full" ? (
          <FullCalendar
        
            selectable={selectedPermission?.role_code !== "STUDENT"}
            select={
              selectedPermission?.role_code !== "STUDENT"
                ? handleDateSelect
                : undefined
            }
            selectOverlap={true}  
             selectMirror={true}     
              eventStartEditable={true}
            // selectOverlap={
            //   selectedPermission?.role_code !== "STUDENT" ? false : true
            // }
            // selectMirror={
            //   selectedPermission?.role_code !== "STUDENT" ? true : false
            // }
            dayCellClassNames={(dateInfo) => {
              const today = new Date();
              const date = new Date(dateInfo.date);
              const isToday = date.toDateString() === today.toDateString();
              const isBlocked =
                selectedPermission?.role_code !== "STUDENT" &&
                savedBlockFrom &&
                savedBlockTo &&
                (dayjs(date).isSame(savedBlockFrom, "day") ||
                  dayjs(date).isSame(savedBlockTo, "day") ||
                  (dayjs(date).isAfter(savedBlockFrom, "day") &&
                    dayjs(date).isBefore(savedBlockTo, "day")));

              if (isBlocked) {
                return style["blockedDay"];
              }

              if (isToday) {
                return style["today"];
              }

              return style["numClass"];
            }}
            eventClassNames={style["eventClass"]}
            nowIndicator={true}
            initialDate={currentDate.toDate()}
            slotMinTime="08:00:00"
            slotMaxTime="32:00:00"
            slotDuration="00:15:00"
          
   
            ref={calanderRef}
            fixedWeekCount={false}
            allDaySlot={true}
            views={{
              twoWeeks: {
                type: "dayGrid",
                duration: { weeks: 2 },
                buttonText: "2 weeks",
              },
            }}
            timeZone="local"
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit" }}
            plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
            initialView={viewMode}
            height={"74vh"}
            // slotEventOverlap={false}
            datesSet={(arg) => setCurrentDate(dayjs(arg.start))}
            headerToolbar={false}
            dayMaxEventRows={false}
            dayMaxEvents={false}
            editable={true}
             selectAllow={() => true}   
            droppable={true}
            allDayContent={(arg) => (
              <div className={style["allDayContainer"]}></div>
            )}
            dropAccept="*"
            forceEventDuration={true}
            eventReceive={(arg) => {
              
              // Prevent double execution
              if (isProcessingDrop) return;
              setIsProcessingDrop(true);

              if (arg.draggedEl.getAttribute("data-team-event") == "true") {
                const { start, id: TeamEventId, extendedProps ,end } = arg.event;

             
                
                if (start && TeamEventId) {
                  const teamEvent = teamEvents.find(
                    (teamEvent: TeamEvent) =>
                      teamEvent.id === parseInt(TeamEventId)
                  );
                  const teamMemberId =
                    activeHeaderType === "teamMember" && selectedTeamMember
                      ? selectedTeamMember.id
                      : null;
                  handleAddTeamEventAssingment({
                    start,
                    end: dayjs(start)
                      .add(arg.event.extendedProps.recommendedTime, "minutes")
                      .toDate(),
                    TeamEventId: parseInt(TeamEventId),
                    teamMemberId,
                  });
                }
              } else {

                   const { start, id: TeamEventId, extendedProps ,end } = arg.event;

               console.log("end אוטומטי מהלוח:", arg.event.end); 
                  

                handleAddEvent.mutate(arg.event);
              }

              // Reset after a short delay
              setTimeout(() => setIsProcessingDrop(false), 100);

              // return handleAddEvent.mutate(arg.event);
            }}
            eventDrop={(info) => {

              console.log("start",info.event.start);
              console.log("end",info.event.end);
              
              if (
                selectedPermission?.role_code === "STUDENT" &&
                info.event.extendedProps.status !== "assignment_bank"
              ) {
                info.revert();

                notification.warning({
                  message: <span style={{ fontWeight: 700 }}>אין הרשאה</span>,
                  description: (
                    <div style={{ lineHeight: 1.6, direction: "rtl" }}>
                      <ExclamationCircleOutlined
                        style={{
                          color: "#faad14",
                          marginLeft: 8,
                          direction: "rtl",
                        }}
                      />
                      <span>פנה לצוות החופפים :</span>

                      <strong style={{ color: "#faad14", marginRight: 4 }}>
                        {" "}
                        {info.event.extendedProps.creatorName} -{" "}
                      </strong>
                      <strong style={{ color: "#faad14", marginRight: 4 }}>
                        {info.event.extendedProps.creatorUsername}
                      </strong>
                    </div>
                  ),
                  placement: "topRight",
                  duration: 4,
                });

                return;
              }
              if (info.event.id.includes("T")) {
                handleUpdateEvent.mutate(info.event);
              } else {
                if (info.event.extendedProps.constant) {
                  setSelectedUpdateEventModal({ info: info, type: "drag" });
                } else {
                  updateTeamEventAssignmentMutation.mutate({
                    id: parseInt(info.event.id),
                    TeamEventId: info.event.extendedProps.id,
                    start: info.event.start!,
                    end:
                      info.event.end ||
                      dayjs(info.event.start).add(1, "hour").toDate(),
                  });
                }
              }
            }}
            eventResize={(info) => {
              if (info.event.id.includes("T")) {
                if (
                  selectedPermission?.role_code === "STUDENT" &&
                  info.event.extendedProps.status !== "assignment_bank"
                ) {
                  info.revert();

                  notification.warning({
                    message: <span style={{ fontWeight: 700 }}>אין הרשאה</span>,
                    description: (
                      <div style={{ lineHeight: 1.6, direction: "rtl" }}>
                        <ExclamationCircleOutlined
                          style={{
                            color: "#faad14",
                            marginLeft: 8,
                            direction: "rtl",
                          }}
                        />
                        <span>פנה לצוות החופפים : </span>

                        <strong style={{ color: "#faad14", marginRight: 4 }}>
                          {info.event.extendedProps.creatorName} -{" "}
                        </strong>
                        <strong style={{ color: "#faad14", marginRight: 4 }}>
                          {info.event.extendedProps.creatorUsername}
                        </strong>
                      </div>
                    ),
                    placement: "topRight",
                    duration: 4,
                  });

                  return;
                }

                handleUpdateEvent.mutate(info.event);
              } else {
                if (info.event.extendedProps.constant) {
                  setSelectedUpdateEventModal({ info: info, type: "move" });
                } else {
                  updateTeamEventAssignmentMutation.mutate({
                    id: parseInt(info.event.id),
                    TeamEventId: info.event.extendedProps.id,
                    start: info.event.start!,
                    end:
                      info.event.end ||
                      dayjs(info.event.start).add(1, "hour").toDate(),
                  });
                }
              }
            }}
            eventDragStart={handleDragStart}
            eventDragStop={(arg) => handleDragStop.mutate(arg)}
            eventClick={handleEventClick}
            events={[
              ...events,
              ...teamEventAssignments
                .filter((assignment: TeamEventAssignment) => {
                  if (activeHeaderType !== "teamMember") return true;

                  if (!selectedTeamMember)
                    return assignment.teamMemberId === null;

                  return (
                    assignment.teamMemberId === null ||
                    assignment.teamMemberId === selectedTeamMember.id
                  );
                })
                .map((assignment: TeamEventAssignment) => {
                  const teamEvent = teamEvents.find(
                    (e: TeamEvent) => e.id === assignment.TeamEventId
                  );
                  if (!teamEvent) return null;
                  return {
                    ...teamEvent,
                    ...assignment,
                  };
                })
                .filter(Boolean),
            ]}
            locale="he"
            direction="rtl"
            eventContent={(arg) => (
              <EventContent
                arg={arg}
                handleEventClick={handleEventClick}
                viewMode={viewMode}
                schemaMap={schemaMap}
                handleOpenTaskModal={handleOpenTaskModal}
                handleOpenTaskStatusModal={handleOpenTaskStatusModal}
                activeHeaderType={activeHeaderType}
                isCommanderOrAdmin={selectedPermission?.role_code !== "STUDENT"}
                handleDragStop={handleDragStop}
              />
            )}
          />
        ) : (
          <div className={style.splitView}>
            <TasksQueuePanel
              tasks={queueData?.data || []}
              isLoading={isQueueLoading}
              onTaskClick={handleTaskClick}
              onAssignmentClick={handleAssignmentClick}
            />

            <div className={style.calendarSection}>
              <FullCalendar
                dayCellClassNames={(dateInfo) => {
                  const today = new Date();
                  const date = new Date(dateInfo.date);
                  const isToday = date.toDateString() === today.toDateString();
                  const isBlocked =
                    selectedPermission?.role_code !== "STUDENT" &&
                    savedBlockFrom &&
                    savedBlockTo &&
                    (dayjs(date).isSame(savedBlockFrom, "day") ||
                      dayjs(date).isSame(savedBlockTo, "day") ||
                      (dayjs(date).isAfter(savedBlockFrom, "day") &&
                        dayjs(date).isBefore(savedBlockTo, "day")));

                  if (isBlocked) {
                    return style["blockedDay"];
                  }

                  if (isToday) {
                    return style["today"];
                  }

                  return style["numClass"];
                }}
                selectable={selectedPermission?.role_code !== "STUDENT"}
                select={
                  selectedPermission?.role_code !== "STUDENT"
                    ? handleDateSelect
                    : undefined
                }
                eventClassNames={style["eventClass"]}
                initialDate={currentDate.toDate()}
                slotMinTime="08:00:00"
                slotMaxTime="32:00:00"
                slotDuration="00:15:00"
                selectAllow={() => true}
                  selectOverlap={true}  
                   selectMirror={true}   
                    eventStartEditable={true}
                ref={calanderRef}
                fixedWeekCount={false}
                allDaySlot={true}
                views={{
                  twoWeeks: {
                    type: "dayGrid",
                    duration: { weeks: 2 },
                    buttonText: "2 weeks",
                  },
                }}
                timeZone="local"
                slotLabelFormat={{ hour: "2-digit", minute: "2-digit" }}
                plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                initialView={viewMode}
                height={"74vh"}
                // slotEventOverlap={false}
                datesSet={(arg) => setCurrentDate(dayjs(arg.start))}
                headerToolbar={false}
                dayMaxEventRows={false}

                dayMaxEvents={false}
                editable={true}
                droppable={true}
                allDayContent={(arg) => (
                  <div className={style["allDayContainer"]}></div>
                )}
                dropAccept="*"
                    eventReceive={(arg) => {
              // Prevent double execution
              if (isProcessingDrop) return;
              setIsProcessingDrop(true);

              if (arg.draggedEl.getAttribute("data-team-event") == "true") {
                const { start, id: TeamEventId, extendedProps } = arg.event;

                if (start && TeamEventId) {
                  const teamEvent = teamEvents.find(
                    (teamEvent: TeamEvent) =>
                      teamEvent.id === parseInt(TeamEventId)
                  );
                  const teamMemberId =
                    activeHeaderType === "teamMember" && selectedTeamMember
                      ? selectedTeamMember.id
                      : null;
                  handleAddTeamEventAssingment({
                    start,
                    end: dayjs(start)
                      .add(arg.event.extendedProps.recommendedTime, "minutes")
                      .toDate(),
                    TeamEventId: parseInt(TeamEventId),
                    teamMemberId,
                  });
                }
              } else {
                handleAddEvent.mutate(arg.event);
              }

              // Reset after a short delay
              setTimeout(() => setIsProcessingDrop(false), 100);

              // return handleAddEvent.mutate(arg.event);
            }}
                eventDrop={(info) => {
                  if (
                    selectedPermission?.role_code === "STUDENT" &&
                    info.event.extendedProps.status !== "assignment_bank"
                  ) {
                    info.revert();

                    notification.warning({
                      message: (
                        <span style={{ fontWeight: 700 }}>אין הרשאה</span>
                      ),
                      description: (
                        <div style={{ lineHeight: 1.6, direction: "rtl" }}>
                          <ExclamationCircleOutlined
                            style={{
                              color: "#faad14",
                              marginLeft: 8,
                              direction: "rtl",
                            }}
                          />
                          <span>פנה לצוות החופפים :</span>

                          <strong style={{ color: "#faad14", marginRight: 4 }}>
                            {" "}
                            {info.event.extendedProps.creatorName} -{" "}
                          </strong>
                          <strong style={{ color: "#faad14", marginRight: 4 }}>
                            {info.event.extendedProps.creatorUsername}
                          </strong>
                        </div>
                      ),
                      placement: "topRight",
                      duration: 4,
                    });

                    return;
                  }

                  handleUpdateEvent.mutate(info.event);
                }}
                eventResize={(info) => {
                  if (
                    selectedPermission?.role_code === "STUDENT" &&
                    info.event.extendedProps.status !== "assignment_bank"
                  ) {
                    info.revert();

                    notification.warning({
                      message: (
                        <span style={{ fontWeight: 700 }}>אין הרשאה</span>
                      ),
                      description: (
                        <div style={{ lineHeight: 1.6, direction: "rtl" }}>
                          <ExclamationCircleOutlined
                            style={{
                              color: "#faad14",
                              marginLeft: 8,
                              direction: "rtl",
                            }}
                          />
                          <span>פנה לצוות החופפים : </span>

                          <strong style={{ color: "#faad14", marginRight: 4 }}>
                            {info.event.extendedProps.creatorName} -{" "}
                          </strong>
                          <strong style={{ color: "#faad14", marginRight: 4 }}>
                            {info.event.extendedProps.creatorUsername}
                          </strong>
                        </div>
                      ),
                      placement: "topRight",
                      duration: 4,
                    });

                    return;
                  }

                  handleUpdateEvent.mutate(info.event);
                }}
                eventDragStart={handleDragStart}
                eventDragStop={(arg) => handleDragStop.mutate(arg)}
                eventClick={handleEventClick}
                events={[
                  ...events,
                  ...teamEventAssignments.map(
                    (teamEventAssignment: TeamEventAssignment) => ({
                      ...teamEvents.find(
                        (teamEvent: TeamEvent) =>
                          teamEventAssignment.TeamEventId === teamEvent.id
                      ),
                      ...teamEventAssignment,
                    })
                  ),
                ]}
                locale="he"
                direction="rtl"
                eventContent={(arg) => (
                  <EventContent
                    arg={arg}
                    handleEventClick={handleEventClick}
                    viewMode={viewMode}
                    schemaMap={schemaMap}
                    handleOpenTaskModal={handleOpenTaskModal}
                    handleOpenTaskStatusModal={handleOpenTaskStatusModal}
                    activeHeaderType={activeHeaderType}
                    isCommanderOrAdmin={
                      selectedPermission?.role_code !== "STUDENT"
                    }
                    handleDragStop={handleDragStop}
                  />
                )}
              />
            </div>
          </div>
        )}
      </div>

      {selectedEvent &&
      !selectedTeamMember &&
      !selectedEvent?.extendedProps?.isQueueTask ? (
        <>
          <TeamTaskModal
            taskId={Number(selectedEvent.extendedProps.task_id)}
            task={tasksData?.find((t: any) => t.id === selectedEvent.id)}
            openModal={openTaskModal}
            setOpenModal={setOpenTaskModal}
          />
          <TaskMembersStatus
            task={
              tasksData?.find((t: any) => t.id === selectedEvent.id) || null
            }
            openModal={openUserModal}
            setOpenModal={setOpenUserModal}
            setSelectedEvent={setSelectedEvent}
          />
        </>
      ) : (
        selectedEvent && (
          <UserTaskModal
            taskId={Number(selectedEvent.extendedProps.task_id)}
            task={
              selectedEvent?.extendedProps?.isQueueTask
                ? {
                    ...queueData?.data?.find(
                      (t: any) =>
                        t.task_id == selectedEvent.extendedProps.task_id
                    ),
                    task_assignment_id: selectedEvent?.task_assignment_id,
                    ...(selectedEvent?.extendedProps?.formId && {
                      formId: selectedEvent.extendedProps.formId,
                    }),
                    ...(selectedEvent?.extendedProps?.feedbackId && {
                      feedbackId: selectedEvent.extendedProps.feedbackId,
                    }),
                    ...(selectedEvent?.extendedProps?.surveyId && {
                      surveyId: selectedEvent.extendedProps.surveyId,
                    }),
                    ...(selectedEvent?.extendedProps?.max_score !==
                      undefined && {
                      max_score: selectedEvent.extendedProps.max_score,
                    }),
                    ...(selectedEvent?.extendedProps?.scorePercentage !==
                      undefined && {
                      scorePercentage:
                        selectedEvent.extendedProps.scorePercentage,
                    }),
                    ...(selectedEvent?.extendedProps?.form_score !==
                      undefined && {
                      form_score: selectedEvent.extendedProps.form_score,
                    }),
                    ...(selectedEvent?.extendedProps?.form_completed_at !==
                      undefined && {
                      form_completed_at:
                        selectedEvent.extendedProps.form_completed_at,
                    }),
                    ...(selectedEvent?.extendedProps?.form_started_at !==
                      undefined && {
                      form_started_at:
                        selectedEvent.extendedProps.form_started_at,
                    }),
                  }
                : tasksData?.find((t: any) => t.id === selectedEvent.id)
            }
            openModal={openUserModal}
            setOpenModal={setOpenUserModal}
            setSelectedEvent={setSelectedEvent}
            completed_at={selectedEvent?.extendedProps?.completed_at}
            onRefresh={() => {
              refetch();
              /*           .then((newTaskData: any) => {
                if (selectedEvent?.extendedProps?.taskassignmentid) {
                  const taskAssignmentId =
                    selectedEvent.extendedProps.taskassignmentid;

                  const updatedTask = newTaskData?.data?.find(
                    (t: any) => t.taskassignmentid === taskAssignmentId,
                  );

                  if (updatedTask) {
                    setSelectedEvent((prev: any) => ({
                      ...prev,
                      extendedProps: {
                        ...prev.extendedProps,
                        completed_at: updatedTask?.completed_at,
                      },
                    }));
                  }
                }
              }); */
            }}
          />
        )
      )}

      <CreateTaskFromCalendar
        open={openWizard}
        onClose={handleWizardClose}
        onCancel={handleWizardCancel}
        axes={filterAxisBatchArchive}
        taskGroups={groupTasks}
        selectedDate={wizardSelectedDate}
        selectedStartTime={wizardSelectedStartTime}
        selectedEndTime={wizardSelectedEndTime}
        onStep1Complete={handleWizardStep1Complete}
        generateConstantTeamEvent={generateConstantTeamEvent}
      />

      <NewTaskModal
        openModal={openNewTaskModal}
        setOpenModal={setOpenNewTaskModal}
        taskGroup={groupTasks}
        editingTask={null}
        taskGroupId={wizardSelectedTaskGroupId}
        axisId={wizardSelectedAxisId}
        AxisColor={wizardSelectedAxisColor}
        filterOption={undefined}
        onTasksChanged={handleNewTaskCreated}
        setSelectedTask={setSelectedTask}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Card
          id="trash-zone"
          style={{
            display: "flex",
            cursor: "grab",
            width: 50,
            height: 50,
            top: "1vh",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            border: "2px dashed #aaa",
            backgroundColor: "#fafafa",
          }}
        >
          <DeleteOutlined />
        </Card>
        {selectedPermission?.role_code !== "STUDENT" && (
          <Tooltip
            trigger="click"
            // open={openTooltipEvents}
            styles={{ body: { width: "21.5vw", borderRadius: "15px" } }}
            title={
              <TeamEventBank
                generateConstantTeamEvent={generateConstantTeamEvent}
              ></TeamEventBank>
            }
          >
            <Button
              onClick={() => {
                setOpenTooltipEvents(!openTooltipEvents);
              }}
              shape="round"
              className={style["add_team_event_button"]}
              icon={<CalendarFilled />}
            >
              בנק אירועים{" "}
            </Button>
          </Tooltip>
        )}
      </div>
      <Modal
        open={selectedUpdateEventModal ? true : false}
        okText="כן"
        cancelText="לא"
        onOk={() => {
          updateTeamEventMutation.mutate(
            {
              ...selectedUpdateEventModal!.info.event.extendedProps.teamEvent,
              id: selectedUpdateEventModal!.info.event.extendedProps.teamEvent
                .id,

              endHour:
                dayjs(selectedUpdateEventModal!.info.event.end!).hour() * 60 +
                dayjs(selectedUpdateEventModal!.info.event.end!).minute(),
              startHour:
                dayjs(selectedUpdateEventModal!.info.event.start!).hour() * 60 +
                dayjs(selectedUpdateEventModal!.info.event.start!).minute(),
              days: selectedUpdateEventModal!.info.event.extendedProps.days.map(
                (day: any) => day.dayNum
              ),
            },
            {
              onSuccess: (data) => {
                queryClient.invalidateQueries({ queryKey: ["teamEvents"] });
                queryClient.invalidateQueries({
                  queryKey: ["teamEventAssignment"],
                });
                generateConstantTeamEvent(
                  dayjs(
                    selectedUpdateEventModal!.info.event.extendedProps.teamEvent
                      .startDate
                  ).toDate(),
                  dayjs(
                    selectedUpdateEventModal!.info.event.extendedProps.teamEvent
                      .endDate
                  ).toDate(),
                  dayjs(selectedUpdateEventModal!.info.event.start!).hour() *
                    60 +
                    dayjs(selectedUpdateEventModal!.info.event.start!).minute(),
                  dayjs(selectedUpdateEventModal!.info.event.end!).hour() * 60 +
                    dayjs(selectedUpdateEventModal!.info.event.end!).minute(),
                  {
                    TeamEventId:
                      selectedUpdateEventModal!.info.event.extendedProps
                        .teamEvent.id,
                    start: dayjs(
                      selectedUpdateEventModal!.info.event.start!
                    ).toDate(),
                    end: dayjs(
                      selectedUpdateEventModal!.info.event.end!
                    ).toDate(),
                  },
                  data.days.map((day: any) => day.dayNum % 7)
                );
                setSelectedUpdateEventModal(null);
              },
            }
          );
        }}
        onCancel={(e) => {
          if (selectedUpdateEventModal?.type === "drag") {
            updateTeamEventAssignmentMutation.mutate({
              id: parseInt(selectedUpdateEventModal!.info.event.id),
              TeamEventId:
                selectedUpdateEventModal!.info.event.extendedProps.id,
              start: selectedUpdateEventModal!.info.event.start!,
              end:
                selectedUpdateEventModal!.info.event.end ||
                dayjs(selectedUpdateEventModal!.info.event.start)
                  .add(1, "hour")
                  .toDate(),
            });
          }
          if (selectedUpdateEventModal?.type === "move")
            updateTeamEventAssignmentMutation.mutate({
              id: parseInt(selectedUpdateEventModal!.info.event.id),
              TeamEventId:
                selectedUpdateEventModal!.info.event.extendedProps.id,
              start: selectedUpdateEventModal!.info.event.start!,
              end:
                selectedUpdateEventModal!.info.event.end ||
                dayjs(selectedUpdateEventModal!.info.event.start)
                  .add(1, "hour")
                  .toDate(),
            });
          setSelectedUpdateEventModal(null);
        }}
      >
        האם לערוך את כל האירועים?
      </Modal>

      <Modal
        title="הערה"
        open={isNoteModalOpen}
        onCancel={() => {
          setIsNoteModalOpen(false);
          setSelectedAssignmentForNote(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsNoteModalOpen(false)}>
            בטל
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveNote}
            loading={updateTeamEventAssignmentMutation.isPending}
            disabled={isStudent}
          >
            שמור
          </Button>,
        ]}
      >
        <Input.TextArea
          rows={4}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="הוסף הערה..."
          disabled={isStudent}
        />
      </Modal>
    </>
  );
};

export default MyCalendar;
