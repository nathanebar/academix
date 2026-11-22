import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useSelectionsStore } from "../store/selectionStore";

export const useFeedbackForm = (
  taskId: string | undefined,
  teamId: string | undefined,
  dates: string[] | undefined,
  assignmentIds: string[] | undefined
) => {
  return useQuery({
    queryKey: ["feedbackForm", taskId, teamId, assignmentIds],
    queryFn: async () => {
      if (!taskId || !teamId) return null;
      if (!assignmentIds || assignmentIds.length === 0) return null;

      const response = await api.post(
        `/task-assignments/${taskId}/${teamId}/feedback-form`,
        {
          dates,
          assignmentIds,
        },
        // a read sent as POST (the body carries the filters): don't block the screen
        { globalLoader: false }
      );

      return response.data;
    },
    enabled: !!taskId && !!teamId && !!assignmentIds?.length,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};
