import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelectionsStore } from "../store/selectionStore";
import { useCourseBatchStore } from "../store/courseBatchStore";
import {
  getCourseBatchFolders,
  createCourseBatchFolder,
  deleteCourseBatchFolder,
  updateCourseBatchFolder,
  getFolderFiles,
  uploadFileToFolder,
  deleteFolderFile as deleteFolderFileApi,
} from "../services/ApiServices";

export interface FolderFile {
  id: number;
  folder_id: number;
  name: string;
  type: string;
  size: number;
  s3_key: string;
  s3_bucket_name: string;
  created_at: string;
  created_by: number | null;
  creator?: {
    id: number;
    name: string;
    username: string;
  };
}

interface Folder {
  id: number;
  name: string;
  color: string;
  repository_kind: string;
  isCustom: boolean;
  course_batch_id?: number;
  team_id?: number;
  team_member_id?: number;
  created_at?: string;
}

type CreateFolderPayload = {
  course_batch_id: number;
  name: string;
  color?: string;
  repository_kind?: string;
  team_id?: number;
  team_member_id?: number;
};

export const useCourseBatchFolders = (options?: {
  teamMemberMode?: boolean;
}) => {
  const { teamMemberMode = false } = options || {};
  const {
    selectedCourseBatch,
    selectedTeam,
    selectedTeamMember,
    activeHeaderType,
  } = useSelectionsStore();
  const { axisBatchArchive } = useCourseBatchStore();
  const queryClient = useQueryClient();

  const isTeamMemberView =
    teamMemberMode && activeHeaderType === "teamMember" && !!selectedTeamMember;

  const teamMemberId = isTeamMemberView ? selectedTeamMember?.id : undefined;

  const {
    data: customFolders = [],
    isLoading: isLoadingCustomFolders,
    refetch: refetchCustomFolders,
  } = useQuery({
    queryKey: [
      "courseBatchFolders",
      selectedCourseBatch?.id,
      selectedTeam?.id,
      teamMemberId,
    ],
    queryFn: async () => {
      if (!selectedCourseBatch?.id) {
        return [];
      }

      const response = await getCourseBatchFolders(
        selectedCourseBatch.id,
        selectedTeam?.id,
        teamMemberId
      );
      let folders = Array.isArray(response) ? response : response?.data ?? [];

      if (isTeamMemberView) {
        folders = folders.filter((f: any) => f.team_member_id === teamMemberId);
      } else if (selectedTeam?.id) {
        folders = folders.filter((f: any) => {
          if (f.team_member_id && !isTeamMemberView) return false;
          if (f.team_id && f.team_id !== selectedTeam.id) return false;
          return true;
        });
      } else {
        folders = [];
      }

      return folders;
    },
    enabled: !!selectedCourseBatch?.id,
    staleTime: 30 * 1000,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      if (!selectedCourseBatch?.id) {
        throw new Error("No course batch selected");
      }

      const payload: CreateFolderPayload = {
        course_batch_id: selectedCourseBatch.id,
        name: data.name,
        color: "gray",
        repository_kind: "operational",
      };

      if (isTeamMemberView) {
        payload.team_member_id = selectedTeamMember?.id;
      } else if (selectedTeam?.id) {
        payload.team_id = selectedTeam.id;
      }

      return await createCourseBatchFolder(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courseBatchFolders", selectedCourseBatch?.id],
      });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteCourseBatchFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courseBatchFolders", selectedCourseBatch?.id],
      });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ folderId, name }: { folderId: number; name: string }) => {
      return await updateCourseBatchFolder(folderId, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courseBatchFolders", selectedCourseBatch?.id],
      });
    },
  });

  const axisFolders = useMemo(() => {
    const axesMap = new Map<number, any>();

    (axisBatchArchive as any[]).forEach((item) => {
      const axis =
        item.Axis ||
        item.axis ||
        item.Task?.TaskGroup?.Axis ||
        item.Task?.axis ||
        item;

      if (!axis?.id || !axis?.name) return;

      if (isTeamMemberView) {
      } else if (selectedTeam?.id) {
        const axisTeamId =
          axis.team_id ??
          item.team_id ??
          item.Task?.TaskGroup?.team_id ??
          item.Task?.team_id;
        if (axisTeamId && axisTeamId !== selectedTeam.id) return;
      } else {
        return;
      }

      if (!axesMap.has(axis.id)) {
        axesMap.set(axis.id, {
          id: axis.id,
          name: axis.name,
          color: axis.color || "gray",
          repository_kind:
            item.repository_kind || axis.repository_kind || "operational",
          team_id: axis.team_id ?? item.team_id ?? null,
          isCustom: false,
        });
      }
    });

    return Array.from(axesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "he")
    );
  }, [axisBatchArchive, selectedTeam, isTeamMemberView]);

  const allFolders = useMemo(() => {
    const customWithFlag = customFolders.map((f: Folder) => ({
      ...f,
      isCustom: true,
    }));

    const merged = [...customWithFlag];

    axisFolders.forEach((axis: Folder) => {
      if (!merged.find((f) => f.id === axis.id && !f.isCustom)) {
        merged.push(axis);
      }
    });

    return merged.sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [customFolders, axisFolders]);

  const useFolderFiles = (folderId: number) => {
    return useQuery({
      queryKey: ["courseBatchFolderFiles", folderId],
      queryFn: async () => {
        const response = await getFolderFiles(folderId);
        return Array.isArray(response) ? response : response?.data ?? [];
      },
      enabled: !!folderId,
      staleTime: 30 * 1000,
    });
  };

  const uploadFileMutation = useMutation({
    mutationFn: async ({
      folderId,
      file,
      s3Key,
      bucket,
    }: {
      folderId: number;
      file: File;
      s3Key: string;
      bucket: string;
    }) => {
      return await uploadFileToFolder(folderId, file, s3Key, bucket);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["courseBatchFolderFiles", variables.folderId],
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteFolderFileApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courseBatchFolderFiles"],
      });
    },
  });

  return {
    customFolders,
    axisFolders,
    allFolders,
    isLoadingCustomFolders,
    refetchCustomFolders,
    createFolder: createFolderMutation.mutate,
    deleteFolder: deleteFolderMutation.mutate,
    updateFolder: updateFolderMutation.mutate,
    isCreating: createFolderMutation.isPending,
    isDeleting: deleteFolderMutation.isPending,
    isUpdating: updateFolderMutation.isPending,
    useFolderFiles,
    uploadFile: uploadFileMutation.mutate,
    deleteFile: deleteFileMutation.mutate,
    isUploading: uploadFileMutation.isPending,
    isFileDeleting: deleteFileMutation.isPending,
  };
};