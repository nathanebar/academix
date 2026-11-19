import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";

export const useTasksByTaskGroupIdAndTeam = (
  groupId: number | string | null | undefined,
  teamId: number | string | null | undefined,
  selectedOption: string
) => {
  const memoizedQueryKey = useMemo(
    () => ["task", groupId, teamId, selectedOption],
    [groupId, teamId, selectedOption]
  );
  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      if (!groupId) return [];
      const { data } = await api.get(`/tasks/getTaskByGroupId`, {
        headers: {
          taskGroupId: groupId,
          teamId: teamId,
          selectedOption: selectedOption,
        },
      });
      return data.data;
    },
    enabled: !!groupId,
  });
};
