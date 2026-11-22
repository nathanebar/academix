import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { feedbackKeys } from "../../api/queryKeys";
import { notification } from "antd";

export const useMissedFetchFeedbackByMemberId = (
  teamMemberId: number | undefined
) => {
  
  return useQuery({
    queryKey: feedbackKeys.missedByMember(teamMemberId),
    queryFn: async () => {
      // Check if at least one ID is valid
      const isValidUserId =
        teamMemberId && !isNaN(teamMemberId) && teamMemberId !== 0;

      if (!isValidUserId) {
        notification.error({ message: "שגיאה בשליחת הבקשה" });
        return { msg: "invalidId" };
      }

      let url = `/feedback/getMissedFeedbacksByUserId/${teamMemberId}`;

      const { data } = await api.get(url);

      return data.data;
    },
    meta: {
      onSuccess: (data: any) => {
        return data;
      },
    },
    enabled: !!teamMemberId,
  });
};
