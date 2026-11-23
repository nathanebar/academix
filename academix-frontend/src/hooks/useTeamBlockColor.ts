// src/hooks/useBlockColorEnabled.ts
// #17: the setting lives only in this query. It used to be copied into a Zustand store
// (blockColorStore) by an effect, and the optimistic toggle wrote that copy. The toggle now
// writes the query cache (rolled back on error), and readers call this hook (same key as
// Layout, which still loads it on every page: no extra request).
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { BlockColorResponse } from "../types/types";
import {
  fetchBlockColorSetting,
  updateBlockColorSetting,
} from "../services/ApiServices";

export const useBlockColorEnabled = (
  teamId: string | undefined,
  batchId: string | undefined
) => {
  const queryClient = useQueryClient();
  const queryKey = ["blockColorEnabled", teamId, batchId];

  const { data, refetch, isFetching } = useQuery<BlockColorResponse>({
    queryKey,
    queryFn: () => fetchBlockColorSetting(teamId!, batchId!),
    enabled: !!teamId && !!batchId,
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: updateBlockColorSetting,
    onMutate: async (newValue) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<BlockColorResponse>(queryKey);

      // optimistic: show the new value right away
      queryClient.setQueryData<BlockColorResponse>(queryKey, {
        ...(previousData ?? {}),
        isBlockColorEnabled: newValue.isBlockColorDto,
      });

      return { previousData };
    },
    onError: (err, newValue, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<BlockColorResponse>(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleBlockColor = (checked: boolean) => {
    if (teamId && batchId) {
      mutation.mutate({
        teamId,
        courseBatchId: batchId,
        isBlockColorDto: checked,
      });
    }
  };
  const updateBlockColor = (checked: boolean) => {
    toggleBlockColor(checked);
  };

  const error = mutation.error
    ? axios.isAxiosError(mutation.error)
      ? mutation.error.response?.data?.message || "Failed to update block color"
      : "An unexpected error occurred"
    : null;

  return {
    // State
    isBlockColorEnabled: data?.isBlockColorEnabled ?? false,
    isLoading: isFetching,
    error,
    isUpdating: mutation.isPending,

    // Actions
    toggleBlockColor,
    updateBlockColor,
    refetch,
  };
};
