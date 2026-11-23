import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axios";
import { useSelectionsStore } from "../store/selectionStore";

type ScopeType = "system" | "domain" | "course" | "team";

export const useFetchDomains = (allowedDomainsIds: number[] | number) => {
  const domainsIdsArray = Array.isArray(allowedDomainsIds)
    ? allowedDomainsIds
    : [allowedDomainsIds];

  const idsParam = domainsIdsArray?.join(",");

  return useQuery({
    queryKey: ["domains", allowedDomainsIds],
    queryFn: async () => {
      if (!domainsIdsArray || domainsIdsArray.length === 0) return [];

      const { data } = await api.get(`/domains/getAllowedDomains`, {
        params: {
          allowedDomainsIds: idsParam,
        },
      });

      return data;
    },
    meta: {
      // #17: the domains live only in this query (read through useDomainsData). The selection
      // (UI state) still falls back to the first domain; read at success time, not at render.
      onSuccess: (data: any) => {
        const { selectedDomain, setSelectedDomain } = useSelectionsStore.getState();
        const isSelectedDomainValid = data.some(
          (domain: any) => domain.id === selectedDomain?.id
        );

        if (!isSelectedDomainValid && data.length > 0) {
          setSelectedDomain(data[0]);
        }
      },
    },
    enabled: !!allowedDomainsIds,
    // reference data: refetched only when invalidated (or when the allowed ids change)
    staleTime: Infinity,
  });
};
