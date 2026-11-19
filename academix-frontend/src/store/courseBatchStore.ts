import { create } from "zustand";
import { CourseBatch } from "../types/types";

interface FolderData {
  id: number;
  name: string;
  color: string;
  repository_kind: string;
  isCustom: boolean;
}

interface CourseBatchStoreState {
  courseBatches: CourseBatch[];
  axisBatchArchive: any[];
  allowCourseBatchIds: number[];
  courseBatchFolders: FolderData[];
  setCourseBatches: (courseBatches: CourseBatch[]) => void;
  setAxisBatchArchive: (axisBatchArchive: any[]) => void;
  setAllowCourseBatchIds: (batchIds: number[]) => void;
  addAllowCourseBatchId: (batchId: number) => void;
  removeAllowCourseBatchId: (batchId: number) => void;
  setCourseBatchFolders: (folders: FolderData[]) => void;
}

export const useCourseBatchStore = create<CourseBatchStoreState>((set) => ({
  courseBatches: [],
  axisBatchArchive: [],
  allowCourseBatchIds: [],
  courseBatchFolders: [],
  setCourseBatches: (courseBatches) => set({ courseBatches }),
  setAxisBatchArchive: (axisBatchArchive) => set({ axisBatchArchive }),
  setAllowCourseBatchIds: (batchIds) => set({ allowCourseBatchIds: batchIds }),
  addAllowCourseBatchId: (batchId) =>
    set((state) => ({
      allowCourseBatchIds: [...state.allowCourseBatchIds, batchId],
    })),
  removeAllowCourseBatchId: (batchId) =>
    set((state) => ({
      allowCourseBatchIds: state.allowCourseBatchIds.filter(
        (id) => id !== batchId
      ),
    })),
  setCourseBatchFolders: (folders) => set({ courseBatchFolders: folders }),
}));