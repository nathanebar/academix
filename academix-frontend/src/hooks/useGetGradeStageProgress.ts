import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";

export  const useGetGradeStageProgress =  (teamIds: Number[]) => {
  const memoizedQueryKey = useMemo(
    () => ["getGradeStageProgress", teamIds],
    [teamIds]
  );

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      if (!teamIds) return null;

      const { data } = await api.get(`/tasks/getGradeStageProgress`, {params: { teamIds },});

      return data;
    },
    enabled: !!teamIds,
    // staleTime: 5 * 60 * 1000,
  });
};
