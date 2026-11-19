import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";
import { useSelectionsStore } from "../store/selectionStore";
import { usePermissionStore } from "../store/permissionStore";
import { useUserStore } from "../store/userStore";
import { useLocation } from "react-router-dom";

export const useTaskGroupsByAxisId = (
  axisId: number[] | null | undefined | any,
  courseBatchId: number,
  filterOption: string
) => {
  const axisIdsArray = useMemo(() => {
    if (!axisId) return [];
    const arr = Array.isArray(axisId) ? axisId : [axisId];
    return arr.filter((id: any) => id != null && !isNaN(id));
  }, [axisId]);
  const location = useLocation();

  const idsParam = axisIdsArray.length > 0 ? axisIdsArray.join(",") : null;
  const { selectedTeam, selectedTeamMember } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();
  const { user } = useUserStore();
  const isStudent = selectedPermission?.role_code === "STUDENT";
  const userId = selectedTeamMember?.id ?? null;
  const queryKey = useMemo(
    () => [
      "taskGroups",
      idsParam,
      courseBatchId,
      filterOption,
      userId,
      selectedTeam?.id,
    ],
    [idsParam, courseBatchId, filterOption, userId, selectedTeam?.id]
  );

  const query = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      if (!idsParam || axisIdsArray.length === 0) return [];
      const params = new URLSearchParams();
      if (
        selectedTeamMember &&
        userId &&
        isStudent &&
        location.pathname !== "/calendar"
      ) {
        params.append("userId", userId.toString());
      }
      const { data } = await api.get(
        `/taskGroup/getTaskGroupByAxisId/${idsParam}/${courseBatchId}/${
          selectedTeam?.id ?? null
        }?${params.toString()}`
      );

      return data.data;
    },
    enabled:
      !!idsParam &&
      axisIdsArray.length > 0 &&
      courseBatchId !== null &&
      courseBatchId !== undefined,
  });

  return {
    ...query,
    queryKey,
  };
};
