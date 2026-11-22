import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

interface SurveyDashboardResponse {
  success: boolean;
  summary: {
    totalSurveys: number;
    activeSurveys: number;
    totalResponses: number;
    totalAssignments: number;
    overallResponseRate: number;
  };
  surveys: SurveyDashboardItem[];
}

interface TraineeDetail {
  name: string;
  militaryId?: string;
  userId: number;
  taskAssignmentId: number;
}

interface SurveyDashboardItem {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  createdAt: string;
  tasks: {
    total: number;
    active: number;
    totalAssignments: number;
    activeAssignments: number;
  };
  responses: {
    totalSubmissions: number;
    completedSubmissions: number;
    startedButNotCompleted: number;
    uniqueRespondents: number;
    responseRate: number;
    completionRate: number;
  };
  scores: {
    average: number | null;
    max: number | null;
    min: number | null;
    totalPoints: number;
  };
  questions: {
    total: number;
    byType: Record<string, number>;
  };
  tasksList: Array<{
    id: number;
    name: string;
    is_active: boolean;
    assignmentsCount: number;
    hasSubmissions: boolean;
    responsesCount: number;
    traineeNames: string[];
    traineeDetails: TraineeDetail[];
  }>;
  recentSubmissions: Array<{
    id: number;
    score: number | null;
    submittedAt: string | null;
    startedAt: string | null;
    taskName: string | null;
    teamName: string | null;
    isPublished: boolean;
  }>;
}

export const useSurveyDashboard = (
  courseId: number,
  teamId?: number,
  courseBatch?: number
) => {
  return useQuery<SurveyDashboardResponse>({
    queryKey: ["surveyDashboard", courseId, teamId, courseBatch],
    queryFn: async () => {
      const { data } = await api.get(
        `/forms/getSurveyDashboard/${courseId}`,
        {
          params: { teamId, courseBatch },
        }
      );
      return data;
    },
    enabled: !!courseId,
  });
};