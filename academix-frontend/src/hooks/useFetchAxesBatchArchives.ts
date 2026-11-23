import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axios";

import { useSelectionsStore } from "../store/selectionStore";
import { usePermissionStore } from "../store/permissionStore";

export const useFetchAxesBatchArchives = (
  allowedCourseBatcheIds: number[] | number,
  selectedCourseBatchId: number | null
) => {
  const coursesIdsArray = Array.isArray(allowedCourseBatcheIds)
    ? allowedCourseBatcheIds
    : [allowedCourseBatcheIds];

  const idsParam = coursesIdsArray?.join(",");

  // narrow selectors: this hook is now called by every component that reads the archive
  const selectedTeamMember = useSelectionsStore((s) => s.selectedTeamMember);
  const activeHeaderType = useSelectionsStore((s) => s.activeHeaderType);

  const isTeamMemberView =
    activeHeaderType === "teamMember" && !!selectedTeamMember;


  const selectedPermission = usePermissionStore((s) => s.selectedPermission);

  return useQuery({
    queryKey: [
      "AxisBatch",
      allowedCourseBatcheIds,
      selectedCourseBatchId,
      selectedTeamMember?.id, 
    ],
    queryFn: async () => {
      if (!coursesIdsArray || coursesIdsArray.length === 0) return [];

      const { data } = await api.get(`/axisBatch/getAllowedAxisBatchArchives`, {
        params: {
          allowedAxisBatchIds: selectedCourseBatchId ?? undefined,
        },
        headers: {
          teammemberid: isTeamMemberView ? String(selectedTeamMember.id) : "",
          notStudentRole: selectedPermission?.role_code != "STUDENT" ? true : false
        },
      });

      return data;
    },

    enabled: !!allowedCourseBatcheIds,
  });
};