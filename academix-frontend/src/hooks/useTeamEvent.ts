import { teamEventKeys } from "../api/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

import { TeamEvent } from "../types/types";
import { useSelectionsStore } from "../store/selectionStore";

export const useTeamEvent = () => {
  const { selectedTeam, selectedCourseBatch } = useSelectionsStore();
  return useQuery({
    // ids only: the whole store objects made a new cache entry on any unrelated field change
    queryKey: teamEventKeys.byTeamAndBatch(selectedTeam?.id, selectedCourseBatch?.id),
    queryFn: async () => {
      const { data } = await api.get(
        `/teamEvents/${selectedTeam.id}/${selectedCourseBatch.id}`,
      );

      return data;
    },
    // previously the queryFn threw on `selectedTeam.id` when nothing was selected
    enabled: !!selectedTeam?.id && !!selectedCourseBatch?.id,
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
      queryClient.invalidateQueries({ queryKey: teamEventKeys.all });
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
        queryKey: teamEventKeys.all,
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
        queryKey: teamEventKeys.all,
      });
    },
  });
};
