import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { notification } from "antd";
import { Task } from "../../store/taskStore";

export const useFetchFormsByUser = (
  userId: number,
  teamId: number,
  type: "form" | "survey" = "form",
  courseBatchId: number,
  selectedPermission: string|undefined
) => {
  return useQuery({
    queryKey: ["formByUserId", userId, teamId, type, courseBatchId],
    queryFn: async () => {
      if (!userId || isNaN(userId) || userId === 0) {
        notification.error({ message: "שגיאה בשליחת הבקשה" });
        return [];
      }

      const { data } = await api.get(
        `/forms/userId/${teamId},${userId},${courseBatchId}`,
        {
          params: { type },
        }
      );

      return data.data;
    },
    meta: {
      onSuccess: (data: any) => {
        return data;
      },
    },
    enabled: !!userId && !!teamId,
  });
};

// Hook נפרד לסקרים
export const useFetchSurveysByUser = (
  userId: number,
  teamId: number,
  courseBatchId: number,
  selectedPermission: string |undefined
) => {
  return useFetchFormsByUser(
    userId,
    teamId,
    "survey",
    courseBatchId,
    selectedPermission
  );
};
