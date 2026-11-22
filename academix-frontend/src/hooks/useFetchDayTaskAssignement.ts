// hooks/useFetchDayTaskAssignement.ts
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { usePermissionStore } from "..//store/permissionStore";
import api from "../api/axios";

export const useFetchDayTaskAssignement = (
  date: string | null,
  teamId: number,
  userId: number,
  isTeamMemberView: boolean,
  selectedCourseBatch: number
) => {
  const selectedPermission = usePermissionStore((state) => state.selectedPermission);
  const isCommanderOrAdmin = selectedPermission?.role_code !== "STUDENT";
  const skipVisibility = isCommanderOrAdmin ? 'true' : 'false';
  
  const memoizedQueryKey = useMemo(
    () => [
      "tasks-day",
      date,
      teamId,
      userId,
      isTeamMemberView,
      selectedCourseBatch,
      skipVisibility
    ],
    [date, teamId, userId, isTeamMemberView, selectedCourseBatch,skipVisibility]
  );
  


  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      let url = `/task-assignments/range/${date}/${date}/`;

      if (isTeamMemberView) {
        url += `assignedUser/${userId}/${teamId}/${selectedCourseBatch}`;
      } else {
        url += `assignedTeam/${teamId}/${selectedCourseBatch}`;
      }

    const { data } = await api.get(url, {
        params: {
          skipVisibility: skipVisibility
        }
      });
      return data.data;
    },
  });
};