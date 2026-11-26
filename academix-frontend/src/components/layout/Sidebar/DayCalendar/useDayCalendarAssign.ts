// Assign (drop from the board) and move/resize mutations of DayCalendar
// (split out of DayCalendar.tsx, issue #102). Same API calls as before.
import dayjs from "dayjs";
import { message } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERIES_TO_INVALIDATE } from "../../../../types/types";
import {
  assignToProgress,
  assignToTeam,
  assignToTeamNew,
  assignToUser,
  assignToUserNew,
  checkTaskAssignmentExists,
  checkUserTaskAssignmentExists,
  updateOccurrence,
  updateToUser,
} from "../../../../services/ApiServices";
import { useAssignHoef } from "../../../../hooks/useHoefAssignment";
import { showAssignHoefModal } from "../AssignHoefModal";
import { showAssignmentModal } from "./AssignmentActionModal";
import { calcEnd } from "./dayCalendarEvents";

type AddPayload = {
  event: any;
  revert: () => void;
};

type Params = {
  activeHeaderType: string | null | undefined;
  selectedTeam: any;
  selectedTeamMember: any;
  selectedCourseBatch: any;
  realDate: string | undefined;
  refetch: () => Promise<unknown>;
  setHoefModalOpen: (open: boolean) => void;
};

export function useDayCalendarAssign({
  activeHeaderType,
  selectedTeam,
  selectedTeamMember,
  selectedCourseBatch,
  realDate,
  refetch,
  setHoefModalOpen,
}: Params) {
  const queryClient = useQueryClient();
  const assignHoefMutation = useAssignHoef();

  const handleAssignmentResponse = async (assId: any) => {
    if (assId?.data?.new_assignment_ids?.length) {
      setHoefModalOpen(true);
    }

    await assignToProgress({
      task_id: assId.data?.task_id,
      task_assignment_id: assId.data.new_assignment_ids,
    });
  };

  const handleAddEvent = useMutation({
    mutationFn: async ({ event, revert }: AddPayload) => {
      const isQueueTask = event.extendedProps?.isQueueTask ?? false;
      const endDate = () =>
        dayjs(event.start)
          .add(event.allDay ? 21 : 1, "hour")
          .toDate();

      const openModal = () => {
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

          await handleAssignmentResponse(res);
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
          await handleAssignmentResponse(res);
          // כרגע אין צורך בסוף בשוביץ לחופף בשיבוץ צוותי (team assignment does not ask for a hoef)
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
          if (res?.data) openModal();
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
          if (res?.data) openModal();

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

  return { handleAddEvent, handleUpdateEvent };
}
