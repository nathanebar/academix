import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
// import { useTaskAssignmentStore } from "../store/taskAssignmentStore";

export const useFetchCheckListsByTaskId = (taskId: number | undefined, userId?: number) => {
  //   const { setTaskAssignments, setSelectedTaskAssignment } = useTaskAssignmentStore();
  return useQuery({
    queryKey: ["checklists", userId, taskId],
    queryFn: async () => {
      if (
        // userId &&
        taskId
      ) {
        const headers: any = {
          // userId,
          taskId,
        };

        const response = await api.get(`/checklists/getCheckListsByTaskId`, {
          headers: headers,
        });
        return response.data;
      } else {
        return { error: "needed taskId in order to fetch" };
      }
    },
    enabled: userId !== undefined || taskId !== undefined,
  });
};
