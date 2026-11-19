import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { TeamEvent, TeamEventAssignment } from "../types/types";
import { useTeamEventAssignmentStore } from "../store/teamEventAssignment";
import { useTeamEventStore } from "../store/teamEventStore";
// In useTeamEventAssignment.ts

// In useTeamEventAssignment.ts

export const useTeamEventAssignment = () => {
  const { setTeamEventsAssignments } = useTeamEventAssignmentStore();
  const { teamEvents } = useTeamEventStore();
  const teamEventsIds = teamEvents.map((teamEvent) => teamEvent.id);

  
  return useQuery({
    queryKey: ["teamEventsAssignment", teamEvents],
    queryFn: async () => {
      const { data } = await api.get(`/teamEventsAssignment/${teamEventsIds}`);
      setTeamEventsAssignments(data); // Move store update here
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
