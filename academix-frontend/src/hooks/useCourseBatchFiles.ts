import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useSelectionsStore } from "../store/selectionStore";

export const useCourseBatchFiles = () => {
  const {
    selectedCourseBatch,
    selectedTeam,
    selectedTeamMember,
    activeHeaderType,
  } = useSelectionsStore();

  return useQuery({
    queryKey: [
      "courseBatchFiles",
      selectedCourseBatch?.id,
      activeHeaderType, 
      selectedTeam?.id ?? null,
      selectedTeamMember?.id ?? null,
    ],
    queryFn: async () => {
      if (!selectedCourseBatch?.id) {
        return [];
      }

      const response = await api.get("/files/filesByCourseBatchId", {
        headers: {
          coursebatchid: selectedCourseBatch.id,
          ...(activeHeaderType === "teamMember" && selectedTeamMember?.id
            ? { teammemberid: String(selectedTeamMember.id) }
            : {}),
          ...(activeHeaderType !== "teamMember" && selectedTeam?.id
            ? { teamid: String(selectedTeam.id) }
            : {}),
        },
      });

      return response.data;
    },
    enabled: !!selectedCourseBatch?.id,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    gcTime: 0,
  });
};