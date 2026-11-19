import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { TeamEvent } from "../types/types";

export const useAddTeamEvents = (teamEvent: TeamEvent) => {
  return useQuery({
    queryKey: ["teamEvents"],
    queryFn: async () => {
      const { data } = await api.post(`/teamEvents`, teamEvent);
      return data;
    },
    meta: {
      onSuccess: (data: any) => {},
    },
    // staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
