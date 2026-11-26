// Status mutation + confirm dialogs of TaskUserTag (split out of TaskUserTag.tsx, issue #106).
import { Modal, message } from "antd";
import { useMutation } from "@tanstack/react-query";
import { TaskAssignmentsCompletedByCommander } from "../../../services/ApiServices";
import { queryClient } from "../../../api/queryClient";
import { taskKeys } from "../../../api/queryKeys";

type ClickEvent = { stopPropagation: () => void };

export type TaskStatusActions = {
  handleMarkDone: (e: ClickEvent) => void;
  handleUndoDone: (e: ClickEvent) => void;
  handleApprove: (e: ClickEvent) => void;
  handleUnapprove: (e: ClickEvent) => void;
};

export function useTaskStatusActions(
  taskAssId: number | string | undefined,
  displayName: string | undefined
): TaskStatusActions {
  const statusMutation = useMutation({
    mutationFn: async ({
      assignmentId,
      action,
    }: {
      assignmentId: number;
      action: string;
    }) => TaskAssignmentsCompletedByCommander(assignmentId, action),
    onSuccess: () => {
      // Each key once (#137): the old code invalidated group-tasks twice and
      // repeated 4 keys through refetchData().
      for (const key of [
        "team-queue-tasks",
        "taskCountByGradeStages",
        "taskCountByAxis",
        "taskGroupsToCalendar",
        "group-tasks",
        "tasks-range",
        "hoefs",
        "tasks-day",
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      // the team member dashboard (was a Zustand "needsRefresh" flag, #17)
      queryClient.invalidateQueries({ queryKey: taskKeys.memberDashboardAll() });
      message.success("הסטטוס עודכן בהצלחה");
    },
    onError: () => {
      message.error("שגיאה בעדכון הסטטוס");
    },
  });

  const confirm = (
    e: ClickEvent,
    title: string,
    content: string,
    action: string
  ) => {
    e.stopPropagation();
    if (!taskAssId) return;
    Modal.confirm({
      title,
      content,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentId: Number(taskAssId),
          action,
        });
      },
    });
  };

  return {
    handleMarkDone: (e) =>
      confirm(e, "?לסמן כבוצע", `האם לסמן את ${displayName} כביצוע?`, "complete"),
    handleUndoDone: (e) =>
      confirm(
        e,
        "?לבטל ביצוע",
        `האם לבטל את סימון הביצוע של ${displayName}?`,
        "undo_complete"
      ),
    handleApprove: (e) =>
      confirm(
        e,
        "?לאשר משימה",
        `האם לאשר את המשימה עבור ${displayName}?`,
        "approve"
      ),
    handleUnapprove: (e) =>
      confirm(
        e,
        "?לבטל אישור",
        `האם לבטל את האישור עבור ${displayName}?`,
        "unapprove"
      ),
  };
}
