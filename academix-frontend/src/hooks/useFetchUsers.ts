import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "../store/userStore";
import api from "../api/axios";

export const useFetchUsers = (allowedIdTeams: number[] | number) => {
  const personIdsArray = Array.isArray(allowedIdTeams)
    ? allowedIdTeams
    : [allowedIdTeams];
  const teamssParams = personIdsArray?.join(",");

  const { setUser } = useUserStore();

  return useQuery({
    queryKey: ["users", allowedIdTeams],
    queryFn: async () => {
      if (!personIdsArray || personIdsArray.length === 0) return [];
      const { data } = await api.get("/users", {
        params: {
          allowedIdTeams: teamssParams,
        },
      });
      return data;
    },
    meta: { onSuccess: (data: any) => setUser(data) },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
