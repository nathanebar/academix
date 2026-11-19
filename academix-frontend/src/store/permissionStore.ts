import { create } from "zustand";
import { persist } from "zustand/middleware";
import { queryClient } from "../api/queryClient";
import { PermissionState, Assignment } from "../types/types";
import api from "../api/axios";

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: [],
      selectedPermission: null,
      developerScope: null,
      loading: false,
      error: null,
      isInitialized: false,

      setPermissions: (permissions) => set({ permissions }),

      setSelectedPermission: (permission) =>
        set({ selectedPermission: permission ?? null }),

      addPermission: (newPermission: Assignment) =>
        set((state) => {
          queryClient.invalidateQueries({ queryKey: ["permissions"] });
          return { permissions: [...state.permissions, newPermission] };
        }),

      removePermission: (permissionId: number) =>
        set((state) => ({
          permissions: state.permissions.filter((p) => p.id !== permissionId),
          selectedPermission:
            state.selectedPermission?.id === permissionId
              ? null
              : state.selectedPermission,
        })),

      fetchPermissions: async (userId: number) => {
        if (!userId) return;
        set({ loading: true, error: null });

        try {
          const response = await api.get(`/permissions/my/${userId}`);
          const fetchedPermissions: Assignment[] = response.data;

          set({
            permissions: fetchedPermissions,
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || "Failed to fetch permissions",
            loading: false,
          });
        }
      },

      clearSelectedPermission: () => set({ selectedPermission: null }),
      setIsInitialized: (value) => set({ isInitialized: value }),
    }),
    {
      name: "permission-storage",
      partialize: (state) => {
        return {
          permissions: state.permissions,
          selectedPermissionId:
            state.selectedPermission?.id ?? state.selectedPermissionId ?? null,
          isInitialized: state.isInitialized,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setIsInitialized(true);

        if (state?.permissions?.length) {
          queryClient.setQueryData(["permissions"], state.permissions);
        }
      },
    }
  )
);
