import { useQuery } from "@tanstack/react-query";
import api from "../../src/api/axios";

interface SurveyMember {
  id: number;
  name: string;
  username?: string;
  militaryId?: string;
  hasResponded: boolean;
  submittedAt?: string;
  assignmentsCount: number;
  responsesCount: number;
  traineeNames: string[];
}

interface SurveyMembersResponse {
  success: boolean;
  data: SurveyMember[];
}

export const useSurveyMembers = (
  surveyId?: number,
  taskId?: number,
  traineeNames?: string[],
  responsesCount?: number
) => {
  return useQuery<SurveyMembersResponse>({
    queryKey: ["surveyMembers", surveyId, taskId],
    queryFn: async () => {
      if (!surveyId) return { success: true, data: [] };

      const { data } = await api.get(
        `${process.env.REACT_APP_API_BASE_URL}/forms/survey/${surveyId}/members`,
        {
          params: { taskId },
        }
      );

      if (!data.data || data.data.length === 0) {
        return {
          success: true,
          data: (traineeNames || []).map((name: string, index: number) => ({
            id: index,
            name,
            username: name,
            hasResponded: index < (responsesCount || 0),
            responsesCount: responsesCount || 0,
            traineeNames: traineeNames || [],
          })),
        };
      }

      const updatedData = data.data.map((member: any, index: number) => ({
        ...member,
        hasResponded: index < (responsesCount || 0),
      }));

      return { ...data, data: updatedData };
    },
    enabled: !!surveyId,
  });
};