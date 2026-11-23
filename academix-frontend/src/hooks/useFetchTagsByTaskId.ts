import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
// import { useTaskAssignmentStore } from "../store/taskAssignmentStore";

export const useFetchTagsByTaskId = (taskId: number | undefined) => {
  return useQuery({
    queryKey: ["tags", taskId],
    queryFn: async () => {
      if (taskId) {
        const headers: any = {
          taskId,
        };

        const response = await api.get(`/tasks/${taskId}/tags`, {
          headers: headers,
        });
        return response.data;
      } else {
        return { error: "needed taskId in order to fetch" };
      }
    },
    enabled: taskId !== undefined,
  });
};
