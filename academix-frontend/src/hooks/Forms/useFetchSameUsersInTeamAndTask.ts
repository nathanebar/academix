import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";

export const useFetchSameUsersInTeamAndTask = (
  taskId: number | undefined,
  teamId: number | undefined,
  selectedCourseBatch:number,
) => {


  
  return useQuery({
    queryKey: ["UsersInTeamAndTask", taskId, teamId,selectedCourseBatch],
    queryFn: async () => {
      if (
        // userId &&
        taskId !== undefined &&
        teamId !== undefined
      ) {
        const headers: any = {
          // userId,
          taskId,
          teamId,
          selectedCourseBatch,

        };

        const response = await api.get(`/forms/getUsersInSameTeamAndTask`, {
          headers: headers,
        });

        return response.data;
      } else {
        return { error: "needed taskId and teamId in order to fetch" };
      }
    },
    meta: {
      onSuccess: (data: any) => {
        return data;
      },
    },
    // enabled: taskId !== undefined && teamId !== undefined,
    enabled: !!taskId,
  });
};
