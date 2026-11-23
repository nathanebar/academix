import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export const useFetchTagsByCourseId = (
  courseId: number | undefined,
  userId?: number
) => {
  return useQuery({
    queryKey: ["tags", userId, courseId],
    queryFn: async () => {
      if (
        // userId &&
        courseId
      ) {
        const headers: any = {
          // userId,
          courseId,
        };

        const response = await api.get(
          `/tag/getTagsByCourseId`,
          {
            headers: headers,
          }
        );
        return response.data;
      } else {
        return { error: "needed courseId in order to fetch" };
      }
    },
    enabled: userId !== undefined || courseId !== undefined,
    // reference data: refetched only when invalidated after a change
    staleTime: Infinity,
  });
};
