import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export const useTaskUsers = (
  taskId: number | string | null | undefined,
  teamId: number | string | null | undefined,
) => {
  return useQuery({
    queryKey: ["task-users", taskId, teamId],
    queryFn: async () => {
      if (!taskId || !teamId) {
        return []; 
      }
      
      const { data } = await api.get(`/tasks/getUsersAssignedToTask/${taskId}?teamId=${teamId}`);
      return data;
    },
    gcTime: 3000,
    enabled: !!taskId && !!teamId,
  });
};