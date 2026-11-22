import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axios";
import { useDomainStore } from "../store/domainStore";
import { useMemo } from "react";
import { useSelectionsStore } from "../store/selectionStore";

type ScopeType = "system" | "domain" | "course" | "team";

export const useFetchDomains = (allowedDomainsIds: number[] | number) => {
  const domainsIdsArray = Array.isArray(allowedDomainsIds)
    ? allowedDomainsIds
    : [allowedDomainsIds];

  const idsParam = domainsIdsArray?.join(",");

  const { setDomains } = useDomainStore();
  const { setSelectedDomain, selectedDomain } = useSelectionsStore();

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
      onSuccess: (data: any) => {
        const isSelectedDomainValid = data.some(
          (domain: any) => domain.id === selectedDomain?.id
        );

        if (!isSelectedDomainValid && data.length > 0) {
          setSelectedDomain(data[0]);
        }
        setDomains(data);
      },
    },
    enabled: !!allowedDomainsIds,
    // reference data: refetched only when invalidated (or when the allowed ids change)
    staleTime: Infinity,
  });
};
