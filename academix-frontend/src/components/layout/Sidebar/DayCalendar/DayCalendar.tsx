import React, { useRef, useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import styles from "./DayCalendar.module.css";
import {
  FlatTask,
  GroupedTask,
  QUERIES_TO_INVALIDATE,
  schemaMap,
  SchemaName,
  TeamMembers,
} from "../../../../types/types";
import { useSelectionsStore } from "../../../../store/selectionStore";
import {
  assignToProgress,
  assignToTeam,
  assignToTeamNew,
  assignToUser,
  assignToUserNew,
  blockTasksForStudents,
  checkTaskAssignmentExists,
  checkUserTaskAssignmentExists,
  deleteTaskAssignmentOccurrence,
  deleteTaskAssignmentOccurrencesTeam,
  deleteTaskAssignmentTeam,
  deleteTaskAssignmentUser,
  fetchBlockedDates,
  fetchTeamQueueTasks,
  getHoefTeamSummary,
  resetBlockedPeriod,
  updateOccurrence,
  updateToTeam,
  updateToUser,
} from "../../../../services/ApiServices";
import dayjs, { Dayjs } from "dayjs";
import { useFetchDayTaskAssignement } from "../../../../hooks/useFetchDayTaskAssignement";
import {
  useQueryClient,
  useMutation,
  useQuery,
  QueryClient,
} from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  message,
  Modal,
  notification,
  Popconfirm,
  Spin,
  Switch,
  Tag,
  Tooltip,
} from "antd";
import { useTeamMembersStore } from "../../../../store/teamMemberStore";
import { useFilteredDataStore } from "../../../../store/filteredDataStore";
import {
  filterStudentMembers,
  TeamMember,
} from "../../../../utils/filterStudentMembers";
import { useRefreshStore } from "../../../../store/selectionStore";
import UserTaskModal from "../../../UserTaskModal/UserTaskModal";
import BlockDatesModal from "../../../Modals/BlockDatesModal/BlockDatesModal";
import { useBlockedDatesStore } from "../../../../store/blockedDatesStore";
import { useFetchBlockDates } from "../../../../hooks/useFetchBlockDates";
import { usePermissionStore } from "../../../../store/permissionStore";
import {
  CalendarOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import QueueView from "../../../QueueView/QueueView";
import {
  EyeInvisibleOutlined,
  FileAddOutlined,
  PlusCircleOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { showAssignmentModal } from "./AssignmentActionModal";
import { useAssignHoef } from "../../../../hooks/useHoefAssignment";
import { showAssignHoefModal } from "../AssignHoefModal";
import ContextMenu from "./ContextMenu";

interface Props {
  startHour?: string;
  endHour?: string;
  student?: TeamMembers;
  tasksByUser?: Array<unknown>;
  style?: React.CSSProperties;
  date?: Date;
}
type AddPayload = {
  event: any;
  revert: () => void;
};
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
  const { teamMembers } = useTeamMembersStore();
  const { selectedPermission } = usePermissionStore();
  const {
    selectedTeam,
    activeHeaderType,
    selectedDate,
    selectedTeamMember,
    selectedCourseBatch,
  } = useSelectionsStore();
  const {} = useFetchBlockDates(
    selectedTeam?.id,
    selectedCourseBatch?.id,
    selectedPermission?.role_code,
  );
  const { savedBlockFrom, savedBlockTo } = useBlockedDatesStore();

  const [isQueueView, setIsQueueView] = useState(false);

  const [queueTasks, setQueueTasks] = useState<any[]>([]);

  const realDate = selectedDate?.format("DD/MM/YYYY");

  const [hoefModalOpen, setHoefModalOpen] = useState(false);
  const assignHoefMutation = useAssignHoef();
  const calcEnd = (event: any) => {
    // אירוע all-day → מסתיים ב-21:00
    if (event.allDay) {
      return dayjs(event.start).add(21, "hour").toDate();
    }
    // אירוע "21 עד 20" (למחרת) → מסתיים ב-+1 שעה
    if (is21to20NextDay(event.id)) {
      return dayjs(event.start).add(1, "hour").toDate();
    }
    // הכלל החשוב חדש: end ריק (NULL) → ברירת מחדל של שעה
    if (!event.end) {
      return dayjs(event.start).add(1, "hour").toDate();
    }
    return event.end;
  };
  const {
    data: tasksData,
    isLoading,
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

  const handleAddEvent = useMutation({
    mutationFn: async ({ event, revert }: AddPayload) => {
      const isQueueTask = event.extendedProps?.isQueueTask ?? false;
      const recommendedTime = event?.extendedProps?.endStr ?? 60;
      const hours = recommendedTime / 60;
      const endDate = () =>
        dayjs(event.start)
          .add(event.allDay ? 21 : 1, "hour")
          .toDate();

      const openModal = (res: any) => {
        setHoefModalOpen(true);
      };

      if (activeHeaderType === "team" && selectedTeam) {
        const hasExisting = await checkTaskAssignmentExists(
          event.id,
          selectedTeam.id,
        );

        if (hasExisting) {
          const action = await showAssignmentModal("team");
          if (!action) {
            revert();
            return;
          }

          const res =
            action === "expand"
              ? await assignToTeam(
                  event.id,
                  selectedTeam.id,
                  event.start,
                  endDate(),
                  selectedCourseBatch?.id,
                  realDate,
                  isQueueTask,
                )
              : await assignToTeamNew(
                  event.id,
                  selectedTeam.id,
                  event.start,
                  endDate(),
                  selectedCourseBatch?.id,
                  realDate,
                );

          await handleAssignmentResponse(res, event, recommendedTime, hours);
        } else {
          const res = await assignToTeam(
            event.id,
            selectedTeam.id,
            event.start,
            endDate(),
            selectedCourseBatch?.id,
            realDate,
            isQueueTask,
          );
          await handleAssignmentResponse(res, event, recommendedTime, hours);

          /*
       כרגע אין צורך בסוף בשוביץ לחופף בשיבוץ צוותי
           if (event) {
            const assignHoef = await showAssignHoefModal(
              {
                taskId: event.id,
                teamId: selectedTeam.id,
                taskName: event?.title,
              },
              queryClient,
            );

            if (assignHoef) {
              const assignmentIds = res?.data?.new_assignment_ids || [];
            

              for (const assignmentId of assignmentIds) {
                await assignHoefMutation.mutateAsync({
                  taskAssignmentId: assignmentId,
                  team_member_id: assignHoef.hoefId,
                  deadline: null,
                });
              }


              queryClient.refetchQueries({
  queryKey: ["hoefs", "team", selectedTeam?.id],
});
              message.success("המשימה שובצה לחופף בהצלחה!");
              setHoefModalOpen(true);
            }
          } */
        }
      } else if (
        activeHeaderType === "teamMember" &&
        selectedTeamMember &&
        selectedTeam
      ) {
        const hasExisting = await checkUserTaskAssignmentExists(
          event.id,
          selectedTeam.id,
          selectedTeamMember.id,
        );
        const memberId = selectedTeamMember.id ?? -1;

        if (hasExisting) {
          const action = await showAssignmentModal("teamMember");
          if (!action) {
            revert();
            return;
          }

          const res =
            action === "expand"
              ? await assignToUser(
                  event.id,
                  selectedTeam.id,
                  memberId,
                  event.start,
                  endDate(),
                  selectedCourseBatch?.id,
                )
              : await assignToUserNew(
                  event.id,
                  selectedTeam.id,
                  memberId,
                  event.start,
                  endDate(),
                  selectedCourseBatch?.id,
                );

          await assignToProgress(res.data);
          if (res?.data) openModal(res);
        } else {
          const res = await assignToUser(
            event.id,
            selectedTeam.id,
            memberId,
            event.start,
            endDate(),
            selectedCourseBatch?.id,
          );
          await assignToProgress(res.data);
          if (res?.data) openModal(res);

          if (event) {
            const assignHoef = await showAssignHoefModal(
              {
                taskId: event.id,
                teamId: selectedTeam.id,
                taskName: event?.title,
              },
              queryClient,
            );

            if (assignHoef) {
              await assignHoefMutation.mutateAsync({
                taskAssignmentId: res?.data?.task_assignment_id,
                team_member_id: assignHoef.hoefId,
                deadline: null,
              });

              message.success("המשימה שובצה לחופף בהצלחה!");
              setHoefModalOpen(true);
            }
          }
        }
      }

      await refetch();
    },

    onSuccess: () => {
      QUERIES_TO_INVALIDATE.forEach((queryKey: any) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    },
  });

  const handleAssignmentResponse = async (
    assId: any,
    event: any,
    recommendedTime: number,
    hours: number,
  ) => {
    if (assId?.data?.new_assignment_ids?.length) {
      assId.data.new_assignment_ids.map((assign: number) => {});
      setHoefModalOpen(true);
    }

    await assignToProgress({
      task_id: assId.data?.task_id,
      task_assignment_id: assId.data.new_assignment_ids,
    });
  };

  const handleUpdateEvent = useMutation({
    mutationFn: async (event: any) => {
      const end = calcEnd(event);
      if (activeHeaderType === "team") {
        if (event.extendedProps.items?.[0].source === "assignment") {
          event.extendedProps.items.map(async (it: any) => {
            await updateToUser(it.taskAssignmentId, event.start, end);
            await refetch();
          });
        } else {
          event.extendedProps.items.map(async (it: any) => {
            await updateOccurrence(it.occurrence_id, event.start, end);
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
              event.end,
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
            event.extendedProps.task_assignment_id,
            event.start,
            event.end,
          );
        } else {
          await updateOccurrence(
            event.extendedProps.task_assignment_id,
            event.start,
            event.end,
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

    if (selectedTeam) {
    }
    if (selectedTeamMember) {
      const eventId = arg.event.id;
      const selected = tasksData?.find((event: any) => event.id == eventId);
      setSelectedTask(selected || null);
    }
  };

  const handleDragStart = (info: any) => {
    /*   const check = canPerformAction(info.event.start);
      if (!check.allowed) {
        return; 
      } */
    if (!student) {
      const trashZone = document.getElementById("trash-zone");
      trashZone?.classList.add("active-trash");
    }
  };

  const handleDragStop = useMutation({
    onMutate: async (info: any) => {
      await queryClient.cancelQueries({ queryKey: ["tasks-team-day"] });

      const previousEvents = eventsAssignement;

      return { previousEvents };
    },

    mutationFn: async (info: any) => {
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

      const result = await new Promise<{ status: "confirmed" | "cancelled" }>(
        (resolve) => {
          if (activeHeaderType === "teamMember" && selectedTeamMember) {
            if (info.event.extendedProps.source === "assignment") {
              Modal.confirm({
                title: "? האם אתה בטוח",
                content: "המחיקה תסיר את כל המופעים מהתלמיד",
                okText: "כן, מחק",
                cancelText: "ביטול",
                onOk: async () => {
                  await deleteTaskAssignmentUser(
                    info.event.extendedProps.task_assignment_id,
                  );
                  resolve({ status: "confirmed" });

                  queryClient.invalidateQueries({
                    queryKey: ["group-tasks"],
                  });

                  await refetch();
                },
                onCancel: () => {
                  resolve({ status: "cancelled" });
                },
              });
            } else {
              Modal.confirm({
                title: "? האם אתה בטוח",
                content: "המחיקה תסיר את כל המופעים מהתלמיד",
                okText: "כן, מחק",
                cancelText: "ביטול",
                onOk: async () => {
                  await deleteTaskAssignmentOccurrence(
                    info.event?.extendedProps?.occurrence_id,
                  );
                  resolve({ status: "confirmed" });
                  await refetch();
                  queryClient.invalidateQueries({
                    queryKey: ["group-tasks"],
                  });
                },
                onCancel: () => {
                  resolve({ status: "cancelled" });
                },
              });
            }
          } else if (activeHeaderType === "team") {
            if (info.event.extendedProps.items[0].source === "occurrence") {
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
                      selectedTeam.id,
                    );
                  }
                  resolve({ status: "confirmed" });
                },
                onCancel: () => {
                  resolve({ status: "cancelled" });
                },
              });
            } else {
              Modal.confirm({
                title: "? האם אתה בטוח",
                content: "המחיקה תסיר את כל המופעים מכל התלמידים",
                okText: "כן, מחק",
                cancelText: "ביטול",
                onOk: async () => {
                  await deleteTaskAssignmentTeam(
                    Number(info.event.extendedProps.task_id),
                    selectedTeam.id,
                    info?.event?.extendedProps?.items.map(
                      (item: any) => item?.id,
                    ),
                    // info.event.startStr
                  );
                  queryClient.refetchQueries({
                    queryKey: ["tasks-range"],
                  });

                  resolve({ status: "confirmed" });
                },
                onCancel: () => {
                  resolve({ status: "cancelled" });
                },
              });
            }
          }
        },
      );

      return result;
    },

    onError: (err, info, context) => {
      if (context?.previousEvents) {
        setEventsAssignement(context.previousEvents);
      }
      message.error("המחיקה נכשלה");
    },

    onSuccess: (result, info, context) => {
      if (result?.status === "cancelled") {
        if (context?.previousEvents) {
          setEventsAssignement(context.previousEvents);
        }
        return;
      }

      if (result?.status === "not_in_trash") {
        return;
      }

      if (info.event) {
        setEventsAssignement((prev) =>
          prev.filter((e) => e.id !== info.event.id),
        );
      }
      triggerRefresh();
    },
  });
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

    const transformedEvents: any[] = tasksData.flatMap((task: any) => {
      if (
        tasksByUser &&
        (!tasksByUser?.find((taskByUser: any) => {
          return parseInt(taskByUser.Task.id) == parseInt(task.task_id);
        }) ||
          task.items?.find((item: any) => item.source !== "assignment"))
      ) {
        return;
      }
      if (activeHeaderType !== "teamMember") {
        const g = task.Task || (task as GroupedTask);
        const eventId = g.id;
        g.taskassignmentid;
        const startISO = dayjs(g.start).toISOString();
        const endISO = dayjs(g.end).toISOString();

        return {
          id: eventId,
          title: g.name,
          student_id: student?.id,
          start: startISO,
          end: endISO,
          allDay: isAllDay(startISO, endISO),
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: "black",
          extendedProps: {
            groupName: g.gn,
            taskColor: g.tcolor,
            axisColor: g.color,
            task_id: g.task_id,
            source: "mixed",
            items: g.items,
          },
        };
      }

      /* -------------------------------------------------
         2️⃣  אם זה תוצאה שטוחה (assignedUserDay) – כל שורה הופכת לאירוע
         ------------------------------------------------- */
      const f = task as FlatTask;

      const startISO = dayjs(f.most_frequent_assigned_at_start).toISOString();
      const endISO = dayjs(f.most_frequent_assigned_at_end).toISOString();

      return {
        id: f.id, // מזהה יחודי של assignment / occurrence
        title: f.name,
        start: startISO,
        end: endISO,
        student_id: student?.id,
        allDay: isAllDay(startISO, endISO),
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: "black",
        extendedProps: {
          groupName: f.gn,
          taskColor: f.tcolor,
          axisColor: f.color,
          source: f.source,
          task_assignment_id: f?.taskassignmentid,
          occurrence_id: f?.occurrence_id,
        },
      };
    });
    setEventsAssignement(transformedEvents.filter((event) => event));
  }, [tasksData, tasksByUser, isError]);

  const removeTaskMutation = useMutation({
    mutationFn: (taskId: number) =>
      deleteTaskAssignmentTeam(taskId, selectedTeam.id),
    onSuccess: () => {
      refetchQueue();
      queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["team-queue-tasks"] });
    },
  });
  const removeAssignMutation = useMutation({
    // mutationFn: (taskId: number) => deleteTaskAssignmentTeam(taskId, selectedTeam.id),
    mutationFn: (taskAssignmentId: number) =>
      deleteTaskAssignmentUser(taskAssignmentId),
    onSuccess: () => {
      refetchQueue();
      queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["team-queue-tasks"] });
    },
  });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    event: any;
  } | null>(null);

  return (
    <div style={{ height: "55vh", position: "relative", ...style }}>
      {!student && (
        /* !selectedTeamMember?.name && */ <>
          <h3 style={{ margin: 0 }}>
            {selectedTeam?.name}
            {selectedTeamMember?.name && " - " + selectedTeamMember?.name}
          </h3>

          {/* תג שמראה באיזה מצב */}
          {/*  <Tag 
    icon={isQueueView ? <UnorderedListOutlined /> : <CalendarOutlined />}
    color={isQueueView ? "blue" : "default"}
    style={{ margin: 0 }}
  >
    {isQueueView ? "תצוגת תור" : "תצוגת לוח שנה"}
  </Tag> */}

          {/* ה-Switch */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              direction: "ltr", // מעבר משמאל לימין
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: isQueueView ? "#1890ff" : "#999",
              }}
            >
              תור
            </span>
            <Switch
              checked={isQueueView}
              onChange={(checked) => setIsQueueView(checked)}
              // checkedChildren="תור"
              unCheckedChildren="לוח"
              size="default"
            />
            <span
              style={{
                fontSize: "12px",
                color: !isQueueView ? "#1890ff" : "#999",
              }}
            >
              לוח שנה
            </span>
          </div>
          {selectedPermission?.role_code !== "STUDENT" && (
            <BlockDatesModal
              isOpen={isBlockModalOpen}
              onOpen={openBlockModal}
              onClose={closeBlockModal}
              selectedTeamId={selectedTeam?.id}
              selectedCourseBatchId={selectedCourseBatch?.id}
              blockedLabelProps={blockedLabel}
            />
          )}
        </>
      )}
      {isQueueView ? (
        <QueueView
          queueTasks={
            queueData?.data?.map((t: any) => ({
              taskId: t.task_id,
              taskName: t.name,
              taskColor: t.task_color || t.axis_color || "#1890ff",
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
        // ======== תצוגת לוח שנה (הקוד הקיים) ========
        <FullCalendar
          ref={calendarRef}
          eventDidMount={(info) => {
            info.el.addEventListener("contextmenu", (e: MouseEvent) => {
              e.preventDefault();

              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                event: info.event,
              });
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
          editable={selectedPermission?.role_code !== "STUDENT" && !student}
          droppable={true}
          eventClick={handleEventClick}
          allDayContent={!student}
          allDaySlot={!student}
          height={student ? "75%" : "100%"}
          slotMinTime={"08:00:00"}
          slotMaxTime={"24:00:00"}
          slotDuration="00:15:00"
          // slotDuration={endHour ? "01:00:00" : "00:30:00"}
          // slotLabelInterval={endHour ? "01:00:00" : "00:30:00"}
          headerToolbar={false}
          nowIndicator={true}
          locale="he"
          dropAccept="*"
          direction="rtl"
          events={eventsAssignement}
          eventContent={(arg) => {
            const taskColor: SchemaName =
              arg.event.extendedProps.taskColor ?? "null";
            const axisColor: SchemaName =
              arg.event.extendedProps.axisColor ?? "null";
            const actualColor =
              !taskColor ||
              taskColor === "null" ||
              taskColor.toLowerCase() === "white"
                ? axisColor
                : taskColor;

            const isLocked =
              arg.event.extendedProps?.isLocked ||
              arg.event.extendedProps?.taskData?.isLocked ||
              false;
            const hasExposure =
              arg.event.extendedProps?.hasExposure ||
              arg.event.extendedProps?.taskData?.hasExposure ||
              false;

            let taskSource: string = "assignment";

            if (activeHeaderType === "team") {
              if (
                arg.event.extendedProps?.items &&
                arg.event.extendedProps.items.length > 0
              ) {
                taskSource = arg.event.extendedProps.items[0].source;
              }
            } else {
              if (arg.event.extendedProps?.source) {
                taskSource = arg.event.extendedProps.source;
              }
            }

            return (
              <>
                <div
                  style={
                    startHour &&
                    parseInt(startHour[1]) < new Date().getHours() &&
                    endHour &&
                    parseInt(endHour[1]) > new Date().getHours()
                      ? {
                          border: "4px solid black",
                        }
                      : undefined
                  }
                  className={styles["dayTaskContainer"]}
                >
                  <div
                    className={styles["dayTaskLine"]}
                    style={{
                      background: `linear-gradient(to right, ${schemaMap[actualColor]?.from}, ${schemaMap[actualColor]?.to})`,
                      boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                  <div className={styles["eventCard"]}>
                    {selectedPermission?.role_code !== "STUDENT" && (
                      <div className={styles["eventGroup"]}>
                        {arg.event.extendedProps.groupName}
                      </div>
                    )}
                    <div
                      className={
                        styles[
                          taskSource === "assignment"
                            ? "eventTask"
                            : "eventTaskOccurrences"
                        ]
                      }
                      style={
                        student && { fontWeight: "normal", fontSize: "1rem" }
                      }
                    >
                      {arg.event.title}

                      {hasExposure && (
                        <EyeInvisibleOutlined
                          style={{
                            fontSize: 14,
                            color: "#000000ff",
                            marginRight: 4,
                          }}
                        />
                      )}

                      {taskSource === "assignment" ? "" : " - הרחבה"}
                    </div>
                    {arg.event.extendedProps.items?.length > 0 && !student
                      ? `  ${
                          teamMemberLength ||
                          arg.event.extendedProps.items?.length
                        } / ${
                          arg.event.extendedProps.items?.length
                        }  מתוך הצוות`
                      : null}
                  </div>
                </div>
              </>
            );
          }}
          eventReceive={(arg) => {
            /*  const check = canPerformAction(arg.event.start!!);
          if (!check.allowed) {
            message.error(check.reason);
            arg.revert();
            return;
          } */
            handleAddEvent.mutate({
              event: arg.event,
              revert: arg.revert,
            });
          }}
          eventDrop={(info) => {
            /*  const check = canPerformAction(info.event.start!!);
          if (!check.allowed) {
            message.error(check.reason);
            info.revert();
            return;
          } */
            handleUpdateEvent.mutate(info.event);
          }}
          eventResize={(info) => {
            /*  const check = canPerformAction(info.event.start!!);
          if (!check.allowed) {
            message.error(check.reason);
            info.revert();
            return;
          } */
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
          // task={null}
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
      {/*  {contextMenu && selectedPermission?.role_code !== "STUDENT" && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    items={[
      {
        key: "assign-hoef",
        label: "שבץ משימה לחופף",
        icon: <TeamOutlined />,
        onClick: async () => {
          const event = contextMenu.event;
        console.log(event);
        
          
         if (event) {
            const assignHoef = await showAssignHoefModal(
              {
                taskId: event.id,
                teamId: selectedTeam.id,
                taskName: event?.title,
              },
              queryClient,
            );

            
            if (assignHoef) {
              const assignmentIds = event.extendedProps.items || [];
        
             
              
        if(assignmentIds?.length > 0){

          for (const assignmentId of assignmentIds) {
            await assignHoefMutation.mutateAsync({
              taskAssignmentId: assignmentId?.taskAssignmentId,
              team_member_id: assignHoef.hoefId,
              deadline: null,
            });
          }
        }else{
    await assignHoefMutation.mutateAsync({
              taskAssignmentId: event?.extendedProps?.task_assignment_id,
              team_member_id: assignHoef.hoefId,
              deadline: null,
            });
        }
         

              message.success("המשימה שובצה לחופף בהצלחה!");
              setHoefModalOpen(true);
            }
          }

        },
      },
    ]}
    onClose={() => setContextMenu(null)}
  />
)} */}
    </div>
  );
}
