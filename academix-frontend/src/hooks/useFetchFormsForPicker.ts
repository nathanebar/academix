import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export const useFetchFormsForPicker = (
  courseId: number, 
  teamId: number,
  type: string
) => {
  
  return useQuery({
    queryKey: ["formsForPicker", courseId, teamId, type],
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.REACT_APP_API_BASE_URL}/forms/getFormsForPicker/${courseId}`,
        { params: { teamId, type } }
      );
      return data;
    },
    enabled: !!courseId,
  });
};