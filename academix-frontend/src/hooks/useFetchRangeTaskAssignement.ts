import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../api/axios";
import { usePermissionStore } from "..//store/permissionStore";

export const useFetchRangeTaskAssignement = (
  startDate: string,
  endDate: string,
  teamId: number,
  userId: number,
  isTeamMemberView: boolean,
  selectedCourseBatch: number,
) => {
  const selectedPermission = usePermissionStore((state) => state.selectedPermission);  
  const isCommanderOrAdmin = selectedPermission?.role_code !== "STUDENT";  
  const skipVisibility = isCommanderOrAdmin ? 'true' : 'false';

  const memoizedQueryKey = useMemo(
    () => [
      "tasks-range",
      startDate,
      endDate,
      teamId,
      userId,
      isTeamMemberView,
      selectedCourseBatch
    ],
    [startDate, endDate, teamId, userId, isTeamMemberView, selectedCourseBatch]
  );

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      let url = `/task-assignments/range/${startDate}/${endDate}/`;

      if (isTeamMemberView) {
        // תצוגת משתמש
        url += `assignedUser/${userId}/${teamId}/${selectedCourseBatch}`;
      } else {
        // תצוגת צוות
        url += `assignedTeam/${teamId}/${selectedCourseBatch}`;
      }

      const { data } = await api.get(url, {
        params: {
          skipVisibility: skipVisibility
        },
        headers:{
          selectedPermission:selectedPermission?.role_code
        }
      });
      
      return data.data;
    },
  });
};