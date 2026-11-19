import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axios";

import { useCourseBatchStore } from "../store/courseBatchStore";
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

  const { setAxisBatchArchive } = useCourseBatchStore();

  const {
    selectedCourseBatch,
    selectedCourse,
    selectedTeam,
    selectedTeamMember,
    activeHeaderType,
  } = useSelectionsStore();

  const isTeamMemberView =
    activeHeaderType === "teamMember" && !!selectedTeamMember;


     const { permissions, selectedPermission, setSelectedPermission } =
        usePermissionStore();

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

    meta: {
      onSuccess: (data: any) => {
        setAxisBatchArchive(data);
      },
    },
    enabled: !!allowedCourseBatcheIds,
  });
};