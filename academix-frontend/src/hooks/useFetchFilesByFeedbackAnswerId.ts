import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";


export const useFetchFilesByFeedbackAnswerId = (
  task_assignment_id: number | undefined,
) => {
  return useQuery({
 
    queryKey: ["filesByFeedbackAnswer", task_assignment_id,],


    queryFn: async () => {
      if (task_assignment_id !== undefined && task_assignment_id !== null) {
        const headers = {
         
          task_assignment_id: task_assignment_id, 
        };

        const { data } = await api.get(
          "/files/filesByFeedbackAnswerId",
          { headers },
        );        
        return data;
      }


      return { error: "feedback_answer_id is required" };
    },

    enabled: task_assignment_id !== undefined && task_assignment_id !== null,
  });
};