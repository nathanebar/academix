import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

import { useTeamEventStore } from "../store/teamEventStore";
import { TeamEvent } from "../types/types";
import { useSelectionsStore } from "../store/selectionStore";

export const useTeamEvent = () => {
  const { selectedTeam, selectedCourseBatch } = useSelectionsStore();
  const { setTeamEvents } = useTeamEventStore();
  return useQuery({
    queryKey: ["teamEvents", selectedTeam, selectedCourseBatch],
    queryFn: async () => {
      const { data } = await api.get(
        `/teamEvents/${selectedTeam.id}/${selectedCourseBatch.id}`,
      );

      return data;
    },
    meta: {
      onSuccess: (data: any) => {
        setTeamEvents(data);
      },
    },
  });
};
export const useRemoveTeamEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/teamEvents/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamEvents"] });
    },
  });
};
export const useAddTeamEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamEvent: any) => {
      const response = await api.post(`/teamEvents`, {
        ...teamEvent,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teamEvents"],
      });
    },
  });
};
export const useUpdateTeamEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamEvent: Partial<TeamEvent>) => {
      const response = await api.put(`/teamEvents/${teamEvent.id}`, {
        teamEvent,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teamEvents"],
      });
    },
  });
};
