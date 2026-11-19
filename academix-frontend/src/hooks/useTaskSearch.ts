// hooks/useTaskSearch.ts
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export type SearchFilters = {
  search: string;
  colors?: string[];
  tagIds?: number[];
  gradeStageIds?: number[];
};

export const useTaskSearch = (
  filters: SearchFilters,
  courseBatchId: number,
  teamId: number | null,
  filterOption: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["task-search", filters, courseBatchId, teamId, filterOption],
    queryFn: async () => {
      const hasFilters =
        filters.colors?.length ||
        filters.tagIds?.length ||
        filters.gradeStageIds?.length;
      if (!filters.search?.trim() && !hasFilters) {
        return { operational: [], assignment_bank: [], archives: [] };
      }
      if (filters.search?.trim().length < 1) {
        return { operational: [], assignment_bank: [], archives: [] };
      }
      const params: Record<string, any> = {
        search: filters.search,
        courseBatchId,
        teamId,
        filterOption,
      };

      if (filters.colors?.length) params.colors = filters.colors;
      if (filters.tagIds?.length) params.tagIds = filters.tagIds;
      if (filters.gradeStageIds?.length)
        params.gradeStageIds = filters.gradeStageIds;

      const { data } = await api.get("/tasks/search", { params });
      return data.data;
    },
    enabled: enabled,
    staleTime: 30 * 1000,
  });
};

// Hook pour récupérer les options de filtre
export const useFilterOptions = (
  courseBatchId: number,
  teamId: number | null,
  status: string
) => {
  return useQuery({
    queryKey: ["filter-options", courseBatchId, teamId, status],
    queryFn: async () => {
      const { data } = await api.get("/tasks/filter-options", {
        params: { courseBatchId, teamId, status },
      });
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
