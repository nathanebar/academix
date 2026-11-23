import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { TeamEvent, TeamEventAssignment } from "../types/types";
import { useTeamEvent } from "./useTeamEvent";
// In useTeamEventAssignment.ts

// In useTeamEventAssignment.ts

export const useTeamEventAssignment = () => {
  // #17: the team events come from their query (same key as useTeamEvent, no extra request),
  // not from a Zustand copy that was only filled when another component mounted useTeamEvent.
  const { data: teamEvents = [] } = useTeamEvent();
  const teamEventsIds: number[] = (teamEvents as Partial<TeamEvent>[])
    .map((teamEvent) => teamEvent.id)
    .filter((id): id is number => id != null);

  return useQuery({
    // the ids only (the whole objects made a new key on any field change)
    queryKey: ["teamEventsAssignment", teamEventsIds],
    queryFn: async () => {
      const { data } = await api.get(`/teamEventsAssignment/${teamEventsIds}`);
      return data;
    },
  enabled: teamEventsIds.length > 0,
  });
};

export const useRemoveTeamEventAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/teamEventsAssignment/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teamEventsAssignment"], // ← Match the query key
      });
    },
  });
};

// Apply same fix to other mutation hooks:
export const useUpdateTeamEventAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamEventAssignment: TeamEventAssignment) => {
      const response = await api.put(
        `/teamEventsAssignment/${teamEventAssignment.id}`,
        teamEventAssignment
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teamEventsAssignment"], // ← Match the query key
      });
    },
  });
};

export const useAddTeamEventAssignments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      teamEventAssignment: Omit<TeamEventAssignment, "id">
    ) => {
      const response = await api.post(
        `/teamEventsAssignment`,
        teamEventAssignment
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teamEventsAssignment"], // ← Match the query key
      });
    },
  });
};
