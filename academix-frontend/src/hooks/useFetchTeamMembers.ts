import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export const useFetchTeamMembers = (
  allowedteamsIds: number[] | number,
  courseBatchId: number
) => {
  const teamsIdsArray = Array.isArray(allowedteamsIds)
    ? allowedteamsIds
    : [allowedteamsIds];

  const idsParam = teamsIdsArray?.join(",");

  return useQuery({
    queryKey: ["teamMembers", allowedteamsIds, courseBatchId],
    queryFn: async () => {
      if (!teamsIdsArray || teamsIdsArray.length === 0) return [];
      const { data } = await api.get(`/teamMembers/getAllowedUsersInTeam`, {
        params: {
          allowedteamMembersIds: idsParam,
          courseBatchId: courseBatchId,
        },
      });
      return data;
    },
    enabled: !!allowedteamsIds,
  });
};
