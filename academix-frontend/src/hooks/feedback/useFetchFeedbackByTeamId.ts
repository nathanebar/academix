import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { notification } from "antd";

export const useFetchFeedbacksByTeamId = (
  teamId: number,
  courseBatchId: number,
  dateFilter: string = "all"
) => {
  return useQuery({
    queryKey: ["feedbacksByTeamId", teamId, courseBatchId, dateFilter],
    queryFn: async () => {
      const isValidTeamId = teamId && !isNaN(teamId) && teamId !== 0;
      const isValidCbId = teamId && !isNaN(courseBatchId) && courseBatchId !== 0;

      if (!isValidTeamId || !isValidCbId) {
        notification.error({ message: "שגיאה בשליחת הבקשה" });
        return { msg: "invalidId" };
      }

      let url = `tasks/getTasksWithFeedbackByTeamId/${teamId}/${courseBatchId}`;
      
      // 🆕 הוסף את הפילטר לשאילתה
      if (dateFilter && dateFilter !== "all") {
        url += `?dateFilter=${dateFilter}`;
      }

      const { data } = await api.get(url);

      return data;
    },
    meta: {
      onSuccess: (data: any) => {
        return data;
      },
    },
    enabled: !!teamId && !!courseBatchId,
  });
};