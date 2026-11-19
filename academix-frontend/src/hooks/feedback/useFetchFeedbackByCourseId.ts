import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { notification } from "antd";

export const useFetchFeedbacksByCourseId = (
  courseId: number,
  courseBatchId:number,
  teamId?: number
) => {


  return useQuery({
    queryKey: ["feedbackcourseId", courseId, "feedbackteamId", teamId,"courseBatchId",courseBatchId],

    
    queryFn: async () => {
      // Check if at least one ID is valid
      const isValidCourseId = courseId && !isNaN(courseId) && courseId !== 0;
      const isValidTeamId = teamId && !isNaN(teamId) && teamId !== 0;

      if (!isValidCourseId && !isValidTeamId) {
        notification.error({ message: "שגיאה בשליחת הבקשה" });
        return { msg: "invalidId" };
      }
      // http://cm-znif-0052:8007/api/feedback/getByCourseId/1/1/?teamId=3 example to team Get request
      // Build URL based on which ID is provided
      let url = `/feedback/getByCourseIdOrTeamId/${courseId}/${courseBatchId}`;
      if (teamId && isValidTeamId) {
        /*  let  */url = `/feedback/getByCourseIdOrTeamId/${courseId}/${courseBatchId}?teamId=${teamId}`;
      }

      const { data } = await api.get(url);

      return data.data;
    },
    meta: {
      onSuccess: (data: any) => {
        return data;
      },
    },
    enabled: !!courseId || !!teamId,
  });
};
