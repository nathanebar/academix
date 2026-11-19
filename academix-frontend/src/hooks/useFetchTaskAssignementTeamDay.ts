import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";

export const useFetchTaskAssignementTeamDay = (
  date: string | null,
  teamId: number
) => {
  const memoizedQueryKey = useMemo(
    () => ["tasks-team-day", date, teamId],
    [date, teamId]
  );

  const fetchTasks = async () => {
    const response = await api.get(
      `/task-assignments/${date}/assigned/${teamId}`
    );
    return response.data.data;
  };

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: fetchTasks,
    staleTime: 105 * 60 * 1000,
    gcTime: 1010 * 60 * 1000,
  });
};
