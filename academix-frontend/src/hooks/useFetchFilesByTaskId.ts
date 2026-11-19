import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
// import { useTaskAssignmentStore } from "../store/taskAssignmentStore";

export const useFetchFilesByTaskId = (taskId: number | undefined, task_assignement?: number | undefined) => {
  return useQuery({
    queryKey: ["files", taskId, task_assignement],
    queryFn: async () => {
      if (taskId) {
        const headers: any = {
          taskId,
        };

        const response = await api.get(`/files/filesByTaskId`, {
          headers: headers,
        });
        return response.data;
      } else {
        return { error: "needed taskId in order to fetch" };
      }
    },
    meta: {
      onSuccess: (data: any) => {
        return data;
      },
    },
    enabled: taskId !== undefined,
  });
};
