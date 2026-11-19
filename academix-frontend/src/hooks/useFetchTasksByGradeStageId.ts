import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";

export const useFetchTasksByGradeStageId = (
  gradeStageIds: number[],
  teamId: number | string | null | undefined,
  userId: number | string | null,
  isTeamMemberView: boolean,
  selectedCourseBatch: number
) => {
  const memoizedQueryKey = useMemo(
    () => [
      "tasksByGradeStage",
      gradeStageIds,
      teamId,
      userId,
      isTeamMemberView,
      selectedCourseBatch,
    ],
    [gradeStageIds]
  );
  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      if (gradeStageIds.length === 0) return [];
      const params: Record<string, any> = {
        gradeStageIds: gradeStageIds.join(","),
        teamId: teamId,
        selectedCourseBatch: selectedCourseBatch,
      };
      if (isTeamMemberView && userId) {
        params.userId = userId;
      }
      if (!gradeStageIds || gradeStageIds?.length === 0) return [];
      const { data } = await api.get(
        `/tasks/getTasksByGradeStageId${isTeamMemberView ? "User" : "Team"}`,
        {
          params,
        }
      );
      return data.data.byGradeStage ?? [];
    },
    enabled: !!gradeStageIds,
  });
};
