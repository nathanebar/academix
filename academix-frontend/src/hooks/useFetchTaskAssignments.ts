import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
// import { useTaskAssignmentStore } from "../store/taskAssignmentStore";

export const useFetchTaskAssignments = (
  userId?: number,
  taskGroupId?: number | number[]
) => {
  //   const { setTaskAssignments, setSelectedTaskAssignment } = useTaskAssignmentStore();
  return useQuery({
    queryKey: ["taskAssignments", userId, taskGroupId],
    queryFn: async () => {
      if (userId) {
        // Fetch user-specific task assignments with optional taskGroupId filter
        const params: any = { userId };

        if (taskGroupId !== undefined) {
          // Handle both single number and array of numbers
          if (Array.isArray(taskGroupId)) {
            params.taskGroupId = taskGroupId.join(",");
          } else {
            params.taskGroupId = taskGroupId.toString();
          }
        }

        const response = await api.get(
          `/task-assignments/getTaskAssignmentsByTaskGroupAndRole`,
          {
            params: params,
          }
        );
        return response.data.data; // הוסף .data כדי להגיע ל-Array הפנימי
      } else {
        // Fetch all task assignments
        const response = await api.get(`/task-assignments/`);
        return response.data.data; // הוסף .data כדי להגיע ל-Array הפנימי
      }
    },
    enabled: userId !== undefined || taskGroupId !== undefined, // Always enabled but with conditional logic
  });
};
