import { useQuery, UseQueryResult } from "@tanstack/react-query";
import api from "../api/axios";

export const useFetchTasksByTagId = (
  tagIds: number[] | undefined,
  teamId: number | string | null | undefined,
  userId: number | string | null,
  isTeamMemberView: boolean,
  selectedCourseBatch: number
): UseQueryResult<any[], Error> => {
  const ids = Array.isArray(tagIds) ? tagIds : [];
  const enabled = ids.length > 0;
  const queryKey = [
    "tasksByTag",
    ...ids,
    teamId,
    userId,
    isTeamMemberView,
    selectedCourseBatch,
  ];

  return useQuery<any[], Error>({
    queryKey,
    enabled,
    queryFn: async () => {
      if (ids.length === 0) return [];
      const params: Record<string, any> = {
        tagIds: ids.join(","),
        teamId: teamId,
        selectedCourseBatch: selectedCourseBatch,
      };
      if (isTeamMemberView && userId) {
        params.userId = userId;
      }
      const { data } = await api.get(
        `/tasks/getTasksByTagIdAnd${isTeamMemberView ? "User" : "Team"}`,
        {
          params,
        }
      );
      return data.data.byTag ?? [];
    },

    retry: 2,
    // staleTime: 5 * 60 * 1000,
  });
};
