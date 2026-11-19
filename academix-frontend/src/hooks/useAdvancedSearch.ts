// hooks/useAdvancedSearch.ts
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { QueryGroup } from "../types/types";

// ==========================================
// 🔥 Helper: Vérifier si la query a des valeurs
// ==========================================
const hasQueryValues = (q: QueryGroup | null): boolean => {
  if (!q) return false;

  const conditionsHaveValue = (q.conditions || []).some((c) => {
    if (!c.value) return false;
    if (typeof c.value === "string") return c.value.trim().length > 0;
    if (Array.isArray(c.value)) return c.value.length > 0;
    return false;
  });

  const groupsHaveValue = (q.groups || []).some((g) => hasQueryValues(g));

  return conditionsHaveValue || groupsHaveValue;
};

// ==========================================
// 🔥 Hook
// ==========================================
export const useAdvancedSearch = (
  query: QueryGroup | null,
  courseBatchId: number,
  teamId: number | null,
  filterOption: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["advanced-search", query, courseBatchId, teamId, filterOption],
    queryFn: async () => {
      // Retourner vide si pas de query ou pas de valeurs
      if (!query || !hasQueryValues(query)) {
        return { operational: [], assignment_bank: [], archives: [] };
      }

      try {
        const { data } = await api.get("/tasks/advanced-search", {
          params: {
            query: JSON.stringify(query),
            courseBatchId,
            teamId,
            filterOption,
          },
        });

        return (
          data?.data || { operational: [], assignment_bank: [], archives: [] }
        );
      } catch (error) {
        console.error("Search error:", error);
        return { operational: [], assignment_bank: [], archives: [] };
      }
    },
    enabled: enabled && !!query,
    staleTime: 30 * 1000,
  });
};
