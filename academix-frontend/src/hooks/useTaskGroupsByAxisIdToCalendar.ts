import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";

export const useTaskGroupsByAxisIdToCalendar = (
  axisId: number[] | null | undefined | any,
  courseBatchId: number,
  filterOption: string
) => {
  const axisIdsArray = Array.isArray(axisId) ? axisId : [axisId];

  const idsParam = axisIdsArray?.join(",");

  const memoizedQueryKey = useMemo(
    () => ["taskGroupsToCalendar", idsParam, courseBatchId],
    [idsParam, courseBatchId, filterOption]
  );

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: async () => {
      if (!axisIdsArray) return [];
      const { data } = await api.get(
        `/taskGroup/getTaskGroupByAxisIdToCalendar/${idsParam}/${courseBatchId}`
      );
  
      return data.data;
    },
    enabled:
      !!axisIdsArray &&
      axisIdsArray.length > 0 
  });
};
