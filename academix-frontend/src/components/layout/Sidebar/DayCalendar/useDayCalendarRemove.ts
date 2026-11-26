// Remove mutations of DayCalendar: drag an event to the trash zone, or remove from the queue view
// (split out of DayCalendar.tsx, issue #102). Same confirms and API calls as before.
import React from "react";
import { message, Modal } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteTaskAssignmentOccurrence,
  deleteTaskAssignmentOccurrencesTeam,
  deleteTaskAssignmentTeam,
  deleteTaskAssignmentUser,
} from "../../../../services/ApiServices";

type Params = {
  activeHeaderType: string | null | undefined;
  selectedTeam: any;
  selectedTeamMember: any;
  eventsAssignement: any[];
  setEventsAssignement: React.Dispatch<React.SetStateAction<any[]>>;
  refetch: () => Promise<unknown>;
  refetchQueue: () => unknown;
  triggerRefresh: () => void;
};

export function useDayCalendarRemove({
  activeHeaderType,
  selectedTeam,
  selectedTeamMember,
  eventsAssignement,
  setEventsAssignement,
  refetch,
  refetchQueue,
  triggerRefresh,
}: Params) {
  const queryClient = useQueryClient();

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
                  );
                  queryClient.invalidateQueries({
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
    mutationFn: (taskAssignmentId: number) =>
      deleteTaskAssignmentUser(taskAssignmentId),
    onSuccess: () => {
      refetchQueue();
      queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["team-queue-tasks"] });
    },
  });

  return { handleDragStop, removeTaskMutation, removeAssignMutation };
}
