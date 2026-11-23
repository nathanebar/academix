import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axios";

import { useSelectionsStore } from "../store/selectionStore";

export const useFetchCourseBatches = (
  allowedCourseBatchesIds: number[] | number,
  selectedCourseId?: number,
) => {

  const coursesIdsArray = Array.isArray(allowedCourseBatchesIds)
    ? allowedCourseBatchesIds
    : [allowedCourseBatchesIds];

  const idsParam = coursesIdsArray?.join(",");


  return useQuery({
    queryKey: ["CourseBatch", allowedCourseBatchesIds,selectedCourseId],
    queryFn: async () => {
      if (!coursesIdsArray || coursesIdsArray.length === 0) return [];

      const { data } = await api.get(`/courseBatch/getAllowedCourseBatches`, {
        params: {
          allowedCourseBatcheIds: idsParam,
        },
      });
      return data;
    },

    meta: {
      // #17: the batches live only in this query (useCourseBatchesData); only the selection is set here.
      onSuccess: (data: any) => {
        const { selectedCourseBatch, setSelectedCourseBatch } = useSelectionsStore.getState();
        const isSelectedBatchValid = selectedCourseId
          ? data.some((batch: any) => batch.id === selectedCourseBatch?.id)
          : data.some((batch: any) => batch.id === selectedCourseBatch?.id);
        
        if (!isSelectedBatchValid && data.length > 0) {
          const batchesForCourse = data.filter(
            (batch: any) => batch.courseId === selectedCourseId
          );
          if (batchesForCourse.length > 0) {
            setSelectedCourseBatch(batchesForCourse[batchesForCourse.length - 1]);
          }
        }
      },
    },
    enabled: !!allowedCourseBatchesIds && !!selectedCourseId,
    // staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
