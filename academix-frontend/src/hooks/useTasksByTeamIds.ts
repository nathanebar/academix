import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";

export const useTasksByTeamIds = (teamIds: Number[],courseBatchId:number) => {
  const memoizedQueryKey = useMemo(
    () => ["tasksByTeamIds", teamIds,courseBatchId],
    [teamIds,courseBatchId]
  );

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      if (!teamIds) return null;

      const { data } = await api.get(`/tasks/getTasksByTeamIds`, {params: { teamIds,courseBatchId },});

      return data;
    },
    enabled: !!teamIds,
    // staleTime: 5 * 60 * 1000,
  });
};
