import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { feedbackKeys } from '../api/queryKeys';


export const useFeedbackByAssignment = (
  taskAssignmentId: number | string | undefined,
  selectedPermission?: string | undefined
) => {

  const id = taskAssignmentId ? Number(taskAssignmentId) : undefined;
  return useQuery({

    queryKey: feedbackKeys.byAssignment(id, selectedPermission),

    queryFn: async () => {
      if (id === undefined) return null;              
      const response = await api.get(
        `/task-assignments/by-assignment/${id}`              
      );
      return response.data;                       
    },


    enabled: !!id,
 
    // staleTime: 5 * 60 * 1000,   // 5 דק (לא חובה)
    // cacheTime: 10 * 60 * 1000, // 10 דק (לא חובה)
  });
};