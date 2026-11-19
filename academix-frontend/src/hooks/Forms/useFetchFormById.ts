import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";

export const useFetchFormByTaskAssignmentId = (
  taskAssignmentId: number | undefined,
  request_for: "show" | "answer" | "grading",
  isSurvey: boolean
) => {
  return useQuery({
    queryKey: ["form", taskAssignmentId, request_for, isSurvey],
    
    queryFn: async () => {
      if (taskAssignmentId) {
        const headers = {
          taskAssignmentId,
          request_for,
          issurvey: isSurvey ? "true" : "false"
        };
        const response = await api.get(`/forms/formByTaskAssignmentId`, {
          headers,
        });
        return response.data;
      } else {
        return { error: "needed taskAssignmentId in order to fetch" };
      }
    },
    enabled: taskAssignmentId !== undefined,
    
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
};