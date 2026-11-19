import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { notification } from "antd";

export const useFetchFormsByCourseIdAndTeamId = (
  courseId: number,
  teamId?: number,
  courseBatch?:number
) => {
  return useQuery({
    queryKey: ["courseIdForForms", courseId, "teamIdForForms", teamId],
    queryFn: async () => {
      const isValidCourseId = courseId && !isNaN(courseId) && courseId !== 0;
      const isValidTeamId = teamId && !isNaN(teamId) && teamId !== 0;

      if (!isValidCourseId && !isValidTeamId) {
        notification.error({ message: "שגיאה בשליחת הבקשה" });
        return { msg: "invalidId" };
      }
      let url = ``;
      if (teamId && isValidTeamId) {

        url = `/forms/getAllByCourseIdAndTeamId/${courseId}?teamId=${teamId}&courseBatch=${courseBatch}`;
      }
      const { data } = await api.get(url);
      return data;
    },
    meta: {
      onSuccess: (data: any) => {
        return data;
      },
    },
    enabled: !!courseId || !!teamId,
  });
};
