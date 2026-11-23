import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axios";
import { useMemo } from "react";
import { useSelectionsStore } from "../store/selectionStore";

type ScopeType = "system" | "domain" | "course" | "team";

export const useFetchTeams = (allowedTeamsIds: number[] | number,courseBatches:any) => {
  // הפיכת הערך למערך אם הוא לא מערך
  const teamsIdsArray = Array.isArray(allowedTeamsIds)
    ? allowedTeamsIds
    : [allowedTeamsIds];

  const idsParam = teamsIdsArray?.join(",");

  const memoizedQueryKey = useMemo(
    () => ["teams", allowedTeamsIds,courseBatches],
    [allowedTeamsIds,courseBatches]
  );

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      if (!teamsIdsArray || teamsIdsArray.length === 0) return [];

      const { data } = await api.get(`/teams/getAllowedTeams`, {
        params: {
          allowedTeamsIds: idsParam,
        },
      });

      return data;
    },

    meta: {
      // #17: the teams live only in this query (useTeamsData); only the selection is set here.
      onSuccess: (data: any) => {
        const { selectedTeam, setSelectedTeam } = useSelectionsStore.getState();
        const isSelectedTeamValid = data.some(
          (team: any) => team.id === selectedTeam?.id
        );
        
        if (!isSelectedTeamValid && data.length > 0) {
          setSelectedTeam(data[0]);
        }
      },
    },
    enabled:
      !!allowedTeamsIds &&
      (Array.isArray(allowedTeamsIds)
        ? allowedTeamsIds.length > 0
        : allowedTeamsIds > 0) && 
      !!courseBatches
    // staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
