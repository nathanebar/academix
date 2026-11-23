import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export const useFetchFormsTitle = (courseId: number, teamId: number,selectedCourseBatch:number,type:string) => {
  return useQuery({
    queryKey: ["formsTitle", courseId, teamId,type],
    queryFn: async () => {
      try {
        const { data } = await api.get(
          `/forms/getAllByCourseIdAndTeamId/${courseId}`,
          { params: { teamId ,courseBatch:selectedCourseBatch,type} }
        );

        return data;
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error; // חשוב להחזיר את השגיאה
      }
    },
    enabled: !!courseId,
    /*  onError: (error: any) => {
            console.log('Error occurred:', error);
        } */
  });
};
