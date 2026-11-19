import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axios";
import { useAxesStore } from "../store/axiStore";
import { useSelectionsStore } from "../store/selectionStore";

export const useFetchAxes = (allowedAxesIds: number[] | number) => {
  const axesIdsArray = Array.isArray(allowedAxesIds)
    ? allowedAxesIds
    : [allowedAxesIds];
  const idsParam = axesIdsArray?.join(",");

  const { setAxes } = useAxesStore();

  const { setSelectedAxis, selectedCourse, selectedCourseBatch } =
    useSelectionsStore();

  return useQuery({
    queryKey: ["axes", allowedAxesIds],
    queryFn: async () => {
      if (!axesIdsArray || axesIdsArray.length === 0) return [];
      const { data } = await api.get(`/axes/getAllowedAxes`, {
        params: {
          allowedAxesIds: idsParam,
          selectedCourseBatch: selectedCourseBatch.id,
        },
      });
      return data;
    },
    meta: {
      onSuccess: (data: any) => {
        setSelectedAxis(data[0]);
        setAxes(data);
      },
    },
    enabled: !!allowedAxesIds,
    //     staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
