import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo } from "react";

export const useTasksBetweenDates = (
  userId: number | undefined, 
  startDate: string, 
  endDate: string, 
  options?: {
    type: 'personal' | 'team';
    teamId?: number;
  }
) => {
  const { type = 'personal', teamId } = options || {};
  

  const queryKey = useMemo(
    () => ["tasks-between-dates", userId, startDate, endDate, type, teamId],
    [userId, startDate, endDate, type, teamId]
  );

  const fetchTasks = async () => {
    let url = '';
    
    if (type === 'team' && teamId) {
      // צוות
      url = `/task-assignments/team/${teamId}/${startDate}/${endDate}`;
    } else {
      // אישי
      url = `/task-assignments/${userId}/${startDate}/${endDate}`;
    }
    
    const response = await api.get(url);
    return response.data;
  };

  return useQuery({
    queryKey,
    queryFn: fetchTasks,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};