import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import dayjs from "dayjs";
import { useBlockedDatesStore } from "../store/blockedDatesStore";

interface BlockedDatesResponse {
  blockFromDate: string | null;
  blockToDate: string | null;
}

export const useFetchBlockDates = (
  teamId: number,
  courseBatchId: number,
  permission: string | undefined
) => {
  const { initFromDB } = useBlockedDatesStore();

  return useQuery({
    queryKey: ["blockedDates", teamId, courseBatchId],
    queryFn: async () => {
      if (permission === "STUDENT") return;
      const { data } = await api.get(
        `/teamCourseBatch/getByTeamAndCourseBatchIds/${teamId}/${courseBatchId}`
      );
      const result: BlockedDatesResponse = {
        blockFromDate: data.data[0]?.blockFromDate || null,
        blockToDate: data.data[0]?.blockToDate || null,
      };

      if (result.blockFromDate && result.blockToDate) {
        const from = dayjs(result.blockFromDate);
        const to = dayjs(result.blockToDate);
        initFromDB(from, to);
      } else {
        initFromDB(null, null);
      }

      return result;
    },
    enabled: !!teamId && !!courseBatchId,
  });
};
