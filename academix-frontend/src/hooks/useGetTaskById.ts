import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";

export const useTaskById = (taskId: number | string | null | undefined) => {
  const memoizedQueryKey = useMemo(() => ["taskById", taskId], [taskId]);

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      if (!taskId) return null;

      const { data } = await api.get(`/tasks/getById/${taskId}`);

      return data;
    },
    enabled: !!taskId,
    // staleTime: 5 * 60 * 1000,
  });
};
