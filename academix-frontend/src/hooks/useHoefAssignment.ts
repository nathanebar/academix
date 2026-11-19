import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import dayjs from "dayjs";
import api from "../api/axios";

export const useHoefsByTaskAssignment = (taskAssignmentId: number | null) => {
  return useQuery({
    queryKey: ["hoefs", "task-assignment", taskAssignmentId],
    queryFn: async () => {
      if (!taskAssignmentId) return [];
      const response = await api.get(
        `/hoefs/task-assignment/${taskAssignmentId}`
      );
      return response.data.data;
    },
    enabled: !!taskAssignmentId,
  });
};

// קבלת חופפים זמינים להוספה
export const useAvailableHoefs = (taskAssignmentId: number | null) => {
  return useQuery({
    queryKey: ["hoefs", "available", taskAssignmentId],
    queryFn: async () => {
      if (!taskAssignmentId) return [];
      const response = await api.get(
        `/hoefs/task-assignment/${taskAssignmentId}/available`
      );
      return response.data.data;
    },
    enabled: !!taskAssignmentId,
  });
};

// קבלת חופפים של משתמש עם סטטוס
export const useUserHoefsWithStatus = (
  teamMemberId: number | null,
  status?: string
) => {
  return useQuery({
    queryKey: ["hoefs", "user", teamMemberId, status],
    queryFn: async () => {
      if (!teamMemberId) return [];
      const response = await api.get(`/hoefs/user/${teamMemberId}/status`, {
        params: { status },
      });
      return response.data.data;
    },
    enabled: !!teamMemberId,
  });
};

// ==========================================
// 🎯 Mutations
// ==========================================

// שמירת כל החופפים למשימה
export const useSaveHoefs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskAssignmentId,
      hoefs,
    }: {
      taskAssignmentId: number;
      hoefs: Array<{
        team_member_id: number;
        deadline: string | null;
      }>;
    }) => {
      const response = await api.post(
        `/hoefs/task-assignment/${taskAssignmentId}`,
        { hoefs }
      );
      return response.data;
    },
    onSuccess: (_, { taskAssignmentId }) => {
      queryClient.invalidateQueries({
        queryKey: ["hoefs", "task-assignment", taskAssignmentId],
      });
    },
  });
};

// הוספת חופף בודד
export const useAddHoef = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskAssignmentId,
      team_member_id,
      deadline,
    }: {
      taskAssignmentId: number;
      team_member_id: number;
      deadline?: string | null;
    }) => {
      const response = await api.post(
        `/hoefs/task-assignment/${taskAssignmentId}/add`,
        { team_member_id, deadline }
      );
      return response.data;
    },
    onSuccess: (_, { taskAssignmentId }) => {
      queryClient.invalidateQueries({
        queryKey: ["hoefs", "task-assignment", taskAssignmentId],
      });
    },
  });
};

// מחיקת חופף
export const useRemoveHoef = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      taskAssignmentId: number;
      team_member_id: number;
    }) => {
      const response = await api.delete(
        `/hoefs/${params.taskAssignmentId}/remove`,
        {
          data: { team_member_id: params.team_member_id },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hoefs"] });
    },
  });
};

export const useHoefTeamSummary = (teamId: number | null) => {
  return useQuery({
    queryKey: ["hoefs", "team", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const response = await api.get(`/hoefs/team/${teamId}/summary`);
      return response.data.data;
    },
    enabled: !!teamId,
  });
};

export const useCreateHoefFromTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskAssignmentId,
      team_member_id,
      deadline,
    }: {
      taskAssignmentId: number;
      team_member_id: number;
      deadline?: string | null;
    }) => {
      // משתמש באותה API endpoint אבל עם נתונים שונים
      const response = await api.post(
        `/hoefs/task-assignment/${taskAssignmentId}/add`,
        { team_member_id, deadline }
      );
      return response.data;
    },
    onSuccess: () => {
      // מחק את כל ה-cache שקשור לחופפים
      queryClient.invalidateQueries({ queryKey: ["hoefs"] });
    },
  });
};

export const useTeamTasks = (
  teamId: number | null,
  includeAssigned: boolean = true
) => {
  return useQuery({
    queryKey: ["hoefs", "team-tasks", teamId, includeAssigned],
    queryFn: async () => {
      if (!teamId) return [];
      const response = await api.get(`/hoefs/team/${teamId}/tasks`, {
        params: { includeAssigned },
      });

      return response.data.data;
    },
    enabled: !!teamId,
  });
};

export interface DragTask {
  task_assignment_id: number;
  task_name: string;
}

export interface HoefInfo {
  id: number;
  team_member_id: number;
  name: string;
}

export interface AssignHoefParams {
  taskAssignmentId: number;
  team_member_id: number;
  deadline?: string | null;
}

export interface AssignHoefResult {
  success: boolean;
  message: string;
  data?: any;
}

export const useAssignHoef = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AssignHoefParams): Promise<AssignHoefResult> => {
      const { taskAssignmentId, team_member_id, deadline } = params;

      const response = await api.post(`/hoefs/${taskAssignmentId}/add`, {
        team_member_id,
        deadline: deadline ?? null,
      });

      return response.data;
    },

    onSuccess: (result, variables) => {
      if (result.success) {
        // רענון כל הנתונים הרלוונטיים
        queryClient.invalidateQueries({ queryKey: ["hoefs"] });
      }
    },
  });
};

export const useUpdateHoefDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      hoefAssignmentId: number;
      deadline: string | null;
    }) => {
      const response = await api.patch(
        `/hoefs/${params.hoefAssignmentId}/deadline`,
        { deadline: params.deadline }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hoefs"] });
    },
  });
};

export const useDragAssignHoef = () => {
  const assignHoefMutation = useAssignHoef();
  const removeHoefMutation = useRemoveHoef();
  const updateDeadlineMutation = useUpdateHoefDeadline();

  const updateHoefDeadline = async (
    hoefAssignmentId: number,
    deadline: string | null
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await updateDeadlineMutation.mutateAsync({
        hoefAssignmentId,
        deadline,
      });

      return {
        success: result.success,
        message: result.success
          ? deadline
            ? `הדדליין עודכן בהצלחה`
            : `הדדליין הוסר`
          : result.message || "שגיאה",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "שגיאה בעדכון הדדליין",
      };
    }
  };

  const assignTaskToHoef = async (
    task: DragTask,
    hoef: HoefInfo
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await assignHoefMutation.mutateAsync({
        taskAssignmentId: task.task_assignment_id,
        team_member_id: hoef.team_member_id,
        deadline: null,
      });

      return {
        success: result.success,
        message: result.success
          ? `המשימה ${task.task_name} הוספה לחופף ${hoef.name}`
          : result.message || "שגיאה בהעברת המשימה",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "שגיאה בהעברת המשימה",
      };
    }
  };

  const removeTaskFromHoef = async (
    task: { task_assignment_id: number; task_name: string },
    hoef: { hoef_member_id: number; name: string }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await removeHoefMutation.mutateAsync({
        taskAssignmentId: task.task_assignment_id,
        team_member_id: hoef.hoef_member_id,
      });

      return {
        success: result.success,
        message: result.success
          ? `המשימה "${task.task_name}" הוסרה מחופף ${hoef.name}`
          : result.message || "שגיאה",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "שגיאה בהסרת המשימה",
      };
    }
  };

  const isAlreadyAssigned = (
    hoefTasks: Array<{ task_assignment_id: number }>,
    taskAssignmentId: number
  ): boolean => {
    return hoefTasks.some((t) => t.task_assignment_id === taskAssignmentId);
  };

  return {
    assignTaskToHoef,
    isAlreadyAssigned,
    removeTaskFromHoef,
    updateHoefDeadline,
    isLoading: assignHoefMutation.isPending,
    error: assignHoefMutation.error,
  };
};
