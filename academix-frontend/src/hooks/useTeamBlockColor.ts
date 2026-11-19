// src/hooks/useBlockColorEnabled.ts
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBlockColorStore } from "../store/blockColorStore";
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

  const {
    isBlockColorEnabled,
    isLoading,
    error,
    setBlockColor,
    setLoading,
    setError,
  } = useBlockColorStore();

  const { data, refetch, isFetching } = useQuery<BlockColorResponse>({
    queryKey: ["blockColorEnabled", teamId, batchId],
    queryFn: () => fetchBlockColorSetting(teamId!, batchId!),
    enabled: !!teamId && !!batchId,
    staleTime: Infinity,
  });

useEffect(() => {
  if (data) {
    setBlockColor(data.isBlockColorEnabled);
  }
  setLoading(isFetching);
}, [data, isFetching]);

  const mutation = useMutation({
    mutationFn: updateBlockColorSetting,
    onMutate: async (newValue) => {
      await queryClient.cancelQueries({
        queryKey: ["blockColorEnabled", teamId, batchId],
      });

      const previousData = queryClient.getQueryData<BlockColorResponse>([
        "blockColorEnabled",
        teamId,
        batchId,
      ]);

      setBlockColor(newValue.isBlockColorDto);

      return { previousData };
    },
    onError: (err, newValue, context) => {
      if (context?.previousData) {
        setBlockColor(context.previousData.isBlockColorEnabled);
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || "Failed to update block color"
            : "An unexpected error occurred"
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["blockColorEnabled", teamId, batchId],
      });
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

  return {
    // State
    isBlockColorEnabled,
    isLoading,
    error,
    isUpdating: mutation.isPending,

    // Actions
    toggleBlockColor,
    updateBlockColor,
    refetch,
  };
};
