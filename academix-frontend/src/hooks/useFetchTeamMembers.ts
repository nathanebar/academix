import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useTeamMembersStore } from "../store/teamMemberStore";

export const useFetchTeamMembers = (
  allowedteamsIds: number[] | number,
  courseBatchId: number
) => {
  const teamsIdsArray = Array.isArray(allowedteamsIds)
    ? allowedteamsIds
    : [allowedteamsIds];

  const idsParam = teamsIdsArray?.join(",");

  const setTeamsMembers = useTeamMembersStore((state) => state.setTeamsMembers);

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
    meta: {
      onSuccess: (data: any) => {
        
        setTeamsMembers(data);
      },
    },
    enabled: !!allowedteamsIds,
  });
};
