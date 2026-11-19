import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';


export const useFeedbackByAssignment = (
  taskAssignmentId: number | string | undefined,
  selectedPermission?: string | undefined
) => {

  const id = taskAssignmentId ? Number(taskAssignmentId) : undefined;
  const headers: any = {selectedPermission};
  return useQuery({

    queryKey: ['feedbackByAssignment', id ,selectedPermission],

    queryFn: async () => {
      if (id === undefined) return null;              
      const response = await api.get(
        `/task-assignments/by-assignment/${id}` ,{headers:headers}              
      );
      return response.data;                       
    },


    enabled: !!id,
 
    // staleTime: 5 * 60 * 1000,   // 5 דק (לא חובה)
    // cacheTime: 10 * 60 * 1000, // 10 דק (לא חובה)
  });
};