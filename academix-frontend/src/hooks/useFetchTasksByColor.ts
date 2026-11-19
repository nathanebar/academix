import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../api/axios";

export const useFetchTasksByColor = (
  teamId: number | string | null | undefined,
  userId: number | string | null,
  isTeamMemberView: boolean,
  selectedCourseBatch: number
): UseQueryResult<any[], Error> => {
  const queryKey = [
    "tasksByColor",
    teamId,
    userId,
    isTeamMemberView,
    selectedCourseBatch,
  ];

  return useQuery<any[], Error>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, any> = {
        teamId: teamId,
        selectedCourseBatch: selectedCourseBatch,
      };
      if (isTeamMemberView && userId) {
        params.userId = userId;
      }
      const { data } = await api.get(
        `/tasks/getTasksByColorAnd${isTeamMemberView ? "User" : "Team"}`,
        {
          params,
        }
      );
      return data.data.byColor ?? [];
    },
    enabled: !!teamId || !!selectedCourseBatch,
    retry: 2,
    // staleTime: 5 * 60 * 1000,
  });
};
