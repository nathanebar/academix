import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export const useGroupTasks = (
  groupId: number | string | null | undefined,
  teamId: number | string | null | undefined,
  userId: number | string | null,
  selectedOption: string,
  isTeamMemberView: boolean,
  selectedCourseBatch: number,
  selectedPermission: string | undefined,
  headerType?: string,
  enabled: boolean = true 
) => {
  return useQuery({
    queryKey: [
      "group-tasks",
      groupId,
      teamId,
      userId,
      selectedOption,
      isTeamMemberView,
      selectedCourseBatch,
      headerType,
      selectedPermission,
    ],
    queryFn: async () => {
      const headers = { selectedPermission: selectedPermission };
      if (!groupId || !selectedCourseBatch)
        return { operational: [], assignment_bank: [], archives: [] };
      const params: Record<string, any> = {
        taskGroupId: groupId,
        teamId: teamId,
        selectedOption: selectedOption,
        selectedCourseBatch: selectedCourseBatch,
      };
      if (isTeamMemberView && userId) {
        params.userId = userId;
      }

      const { data } = await api.get(
        `/tasks/getTaskByGroupIdAnd${isTeamMemberView ? "User" : "Team"}`,
        { params, headers }
      );
      return data.data;
    },
    enabled: !!groupId && !!selectedCourseBatch && !enabled, 
    staleTime: 5 * 60 * 1000, 
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
