import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "../api/axios";
import { usePermissionStore } from "../store/permissionStore";
import { useTeamStore } from "../store/teamStore";
import { useCourseBatchStore } from "../store/courseBatchStore";
import { useDomainStore } from "../store/domainStore";
import { useCourseStore } from "../store/courseStore";
import { useAxesStore } from "../store/axiStore";
import { useUserStore } from "../store/userStore";
import { queryClient } from "../api/queryClient";

export const useFetchPermissions = (id?: string | number) => {
  const setPermissions = usePermissionStore((state) => state.setPermissions);
  const setSelectedPermission = usePermissionStore(
    (state) => state.setSelectedPermission
  );
  const setIsInitialized = usePermissionStore(
    (state) => state.setIsInitialized
  );
  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );
  const isInitialized = usePermissionStore((state) => state.isInitialized);
  const setAllowTeamIds = useTeamStore((state) => state.setAllowTeamIds);
  const setAllowCourseBatchIds = useCourseBatchStore(
    (state) => state.setAllowCourseBatchIds
  );
  const setAllowDomainIds = useDomainStore((state) => state.setAllowDomainIds);
  const setAllowCourseIds = useCourseStore((state) => state.setAllowCourseIds);
  const setAllowAxisIds = useAxesStore((state) => state.setAllowAxisIds);
  const { user } = useUserStore();
  const userId = id || user?.id;

  const query = useQuery({
    queryKey: ["permissions", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("No user ID available");
      }
      // the user comes from the session cookie (#13); userId only keys the cache
      const { data } = await api.get(`/permissions/my`);
      return data;
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (query.data && userId) {
      const stored = localStorage.getItem("permission-storage");

      let storedId: number | string | null = null;
      // ✅ תיקון: בדיקה אם stored קיים ולא ריק לפני פרסור
      if (stored && stored.trim() !== "") {
        try {
          const parsed = JSON.parse(stored);
          storedId = parsed?.state?.selectedPermissionId;
        } catch (e) {
          console.warn("Failed to parse permission-storage:", e);
        }
      }

      let userPermission = null;

      if (storedId) {
        userPermission = query.data.find(
          (d: any) => /* d.user_id === userId && */ d.id === storedId
        );
      } else {
        userPermission = query.data.find(
          (d: any) => d.user_id === userId
        );
      }

    
      
      setAllowAxisIds(userPermission?.allowedAxisIds || []);
      setAllowCourseBatchIds(userPermission?.allowedCourseBatcheIds || []);
      setAllowCourseIds(userPermission?.allowedCourseIds || []);
      setAllowDomainIds(userPermission?.allowedDomainIds || []);
      setAllowTeamIds(userPermission?.allowedTeamIds || []);
      setPermissions(query.data);

      setSelectedPermission(userPermission || null);
      setIsInitialized(true);
    }
  }, [query.data, userId]);

  useEffect(() => {
    if (query.data) {
      queryClient.setQueryData(["permissions", userId], query.data);
    }
  }, [query.data]);

  return query;
};