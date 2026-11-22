import axios from "axios";
import {
  Axis,
  AxisTemplate,
  BlockColorResponse,
  BlockColorUpdateParams,
  Form,
  QuestionType,
  Role,
  TaskGroupData,
  TeamEventAssignment,
} from "../types/types";
import { Dayjs } from "dayjs";
import { queryClient } from "../api/queryClient";
import { feedbackKeys } from "../api/queryKeys";
import { message } from "antd";
import api from "../api/axios";

export async function GetUserData(username: string): Promise<any> {
  if (username.trim() === "") {
    return;
  }

  let res: any;
  try {
    res = await api.get(
      `/users/getUserData/${username}`,
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.log(error);
  }
  return res;
}

export async function getUserByUsername(username: string): Promise<any> {
  try {
    const req = await api.get(
      `/users/by-username/${username}`,
      {
        withCredentials: true,
      }
    );
    return req.data;
  } catch (error: any) {
    return null;
  }
}

export async function createUser(data: any) {
  try {
    const req = await api.post(
      `/users`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    return error.response;
  }
}

export async function getAllRoleAssigments() {
  try {
    const req = await api.get(
      `/roleAssignments`
    );

    return req.data;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function createRoleAssigment(data: any) {
  try {
    const req = await api.post(
      `/roleAssignments`,
      data,
      {
        withCredentials: true,
      }
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function deleteRoleAssigment(userId: number, scopeId: number) {
  try {
    const req = await api.delete(
      `/roleAssignments/${userId}/${scopeId}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function getAllUsers() {
  try {
    const req = await api.get(`/users`, {
      withCredentials: true,
    });
    return req.data;
  } catch (error: any) {
    console.log(error);
    return [];
  }
}

export async function addTeamMember(data: any) {
  try {
    const req = await api.post(
      `/teamMembers`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function deleteTeamMember(teamId: number, userId: number) {
  const params = [teamId, userId];

  try {
    const req = await api.delete(
      `/teamMembers/${params}`
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function updateTeamMember(
  teamId: number,
  userId: number,
  data: {},
  courseId?: number,
  course_batch_id?: number
) {
  const params = [teamId, userId, courseId, course_batch_id];
  try {
    const req = await api.put(
      `/teamMembers/${params}`,
      data
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function createCourse(data: any) {
  try {
    const req = await api.post(
      `/courses`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function updateCourse(data: any, courseId: any) {
  try {
    const req = await api.put(
      `/courses/${courseId}`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function deleteCourse(courseId: any) {
  try {
    const req = await api.delete(
      `/courses/${courseId}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function updateDomain(data: any, domainId: any) {
  try {
    const req = await api.put(
      `/domains/${domainId}`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function createCourseBatch(data: any) {
  try {
    const req = await api.post(
      `/courseBatch`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function updateCourseBatch(data: any, courseId: any) {
  try {
    const req = await api.put(
      `/courseBatch/${courseId}`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function deleteCourseBatch(courseBatchId: any) {
  try {
    const req = await api.delete(
      `/courseBatch/${courseBatchId}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function createTeam(data: any) {
  try {
    const req = await api.post(
      `/teams`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function updateAxis(axisId: number | null, axisData: any) {
  try {
    const response = await api.put(
      `/axes/${axisId}`,
      axisData,
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating axis data:", error);
    throw error;
  }
}

export async function addDomain(data: any) {
  try {
    const req = await api.post(
      `/domains`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function updateTeam(data: any) {
  try {
    const req = await api.put(
      `/teams/${data.id}`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function deleteTeam(data: any) {
  try {
    const req = await api.delete(
      `/teams/${data}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function createAxisData(
  axisData: Axis,
  selectedCourseBatch: number
) {
  try {
    const response = await api.post(
      `/axes/${selectedCourseBatch}`,
      axisData,
      {
        withCredentials: true,
      }
    );

    return response.data as Axis;
  } catch (error) {
    console.error("Error creating axis data:", error);
    throw error;
  }
}

export async function createTaskGroup(
  taskGroup: TaskGroupData,
  selectedCourseBatch: number,
  axisId: number | undefined
) {
  try {
    const response = await api.post(
      `/taskGroup/${selectedCourseBatch}/${axisId}`,
      taskGroup,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating task group:", error);
    throw error;
  }
}

export async function deleteAxis(id: any) {
  try {
    const req = await api.delete(
      `/axes/${id}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function deleteDomain(id: any) {
  try {
    const req = await api.delete(
      `/domains/${id}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function getTeamMemberByUserIdAndTeamId(
  userId: number | undefined,
  teamId: number| undefined
) {
  try {
    const req = await api.get(
      `/teamMembers/getTeamMemberByUserIdAndTeamId/${userId}/${teamId}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function assignToProgress(data: any) {
  try {
    const req = await api.post(
      `/assignmen_progress/create`,
      { data }
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function updateMissionCompleted(id: number) {
  try {
    const req = await api.put(
      `/assignmen_progress/updateMissionCompleted/${id}`
    );

    queryClient.invalidateQueries({
      queryKey: ["group-tasks"],
    });

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function removeMissionCompleted(id: number) {
  try {
    const req = await api.put(
      `/assignmen_progress/removeMissionCompleted/${id}`
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function updateTaskAssignmentsCompleted(id: any) {
  try {
    const req = await api.put(
      `/assignmen_progress/updateTaskAssignmentCompleted/${id}`
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function TaskAssignmentsCompletedByCommander(
  task_ass_id: number,
  action?: string
) {
  try {
    const req = await api.put(
      `/assignmen_progress/TaskAssignmentsCompletedByCommander/${task_ass_id}`,
      { action }
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function AllTaskAssignmentsCompletedByCommander(
  task_id: number,
  memberId?: number
) {
  try {
    const req = await api.put(
      `/assignmen_progress/AllTaskAssignmentsCompletedByCommander/${task_id}`,
      memberId ? { memberId } : {}
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function ApproveTaskAssignment(task_id: number, memberId: number) {
  try {
    const req = await api.put(
      `/assignmen_progress/AllTaskAssignmentsCompletedByCommander/${task_id}`,
      { memberId }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function CancelTaskApproval(task_id: number) {
  try {
    const req = await api.put(
      `/assignmen_progress/cancelApproval/${task_id}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function GetAssignmentsCompletedByUser(
  task_assignment_id: number
) {
  try {
    const req = await api.get(
      `/assignmen_progress/GetAssignmentsCompletedByUser?task_assignment_id=${task_assignment_id}`
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function GetAssignmentsCompletedByTeam(
  task_id: number,
  team_id: any
) {
  try {
    const req = await api.get(
      `/assignmen_progress/GetAssignmentsCompletedByTeam?task_id=${task_id}&team_id=${team_id}`
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function assignProgressCompleted(task_assignment_id: any) {
  try {
    const req = await api.get(
      `/assignmen_progress/getByAssId?task_assignment_id=${task_assignment_id}`
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function assignToTeam(
  taskId: number,
  teamId: number,
  start: Date | null, 
  end: Date | null, 
  course_batch_id: number,
  realDate: string | undefined,
  isQueueTask: boolean = false 
) {
  try {
    const req = await api.post(
      `/task-assignments/${taskId}/team/${teamId}`,
      {
        start:  start,

        end: end,
        course_batch_id: course_batch_id,
        realDate: realDate,
        isQueueTask: isQueueTask,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function assignToTeamNew(
  taskId: number,
  teamId: number,
  start: Date | null,
  end: Date | null,
  course_batch_id: number,
  realDate: string | undefined,
  isQueueTask: boolean = false
) {
  try {
    const req = await api.post(
      `/task-assignments/${taskId}/team_new/${teamId}`,
      {
        start: start,
        end: end,
        course_batch_id: course_batch_id,
        realDate: realDate,
        isQueueTask: isQueueTask, 
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function assignToUserNew(
  taskId: number,
  teamId: number,
  userId: number,
  start: Date | null,
  end: Date | null,
  course_batch_id: number,
  isQueueTask: boolean = false 
) {
  try {
    const req = await api.post(
      `/task-assignments/${taskId}/user_new/${userId}`,
      {
        start: start,
        end: end,
        team_id: teamId,
        course_batch_id: course_batch_id,
        isQueueTask: isQueueTask,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function assignToUser(
  taskId: number,
  teamId: number,
  userId: number,
  start: Date | null,
  end: Date | null,
  selectedCourseBatch: number,
  isQueueTask: boolean = false 
) {
  try {
    const req = await api.post(
      `/task-assignments/${taskId}/user/${userId}`,
      {
        start: start,
        end: end,
        teamId: teamId,
        course_batch_id: selectedCourseBatch,
        isQueueTask: isQueueTask,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function updateToTeam(
  taskId: number,
  teamId: number,
  start: string,
  end: string
) {
  try {
    const req = await api.put(
      `/task-assignments/${taskId}/team/${teamId}`,
      { start: start, end: end }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function updateToTeamOccurrence(
  occurrenceId: number, 
  teamId: number, 
  start: string,
  end: string
) {
  try {
    const { data } = await api.put(
      `/task-assignment/occurrence/${occurrenceId}/team/${teamId}`,
      { start, end } 
    );
    return data;
  } catch (err: any) {
    console.error("updateToTeamOccurrence error:", err);
    return err.response?.data;
  }
}

export async function updateToUser(
  task_assignement_id: number,
  start: string,
  end: string
) {
  try {
    const req = await api.put(
      `/task-assignments/${task_assignement_id}`,
      { start: start, end: end }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function updateOccurrence(
  occurrenceId: number,
  start: string,
  end: string
) {
  try {
    const res = await api.put(
      `/task-assignments/occurrences/${occurrenceId}`,
      { start, end }
    );
    return res;
  } catch (err: any) {
    console.error(err);
    return err.response;
  }
}

export async function deleteTaskAssignmentTeam(
  taskId: any,
  teamId: any,
  assignment_ids?: number[] 
) {
  try {
    const req = await api.delete(
      `/task-assignments/taskId/${taskId}/teamId/${teamId}`,
      {
        data: assignment_ids ? { assignment_ids } : {},
      }
    );

    queryClient.invalidateQueries({
      queryKey: ["group-tasks"],
    });

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function deleteTaskAssignmentOccurrencesTeam(
  occurrenceId: number,
  teamId: number
) {
  try {
    const { data } = await api.delete(
      `/task-assignments/occurrences/${occurrenceId}/team/${teamId}`
    );
    return data;
  } catch (err: any) {
    console.error("deleteTaskAssignmentOccurrencesTeam error:", err);
    return err.response?.data;
  }
}

export async function deleteTaskAssignmentByUserId(
  taskId: any,
  teamId: any,
  userId: any
) {
  try {
    const req = await api.delete(
      `/task-assignments/taskId/${taskId}/teamId/${teamId}/userId/${userId}`
    );

    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function createForm(form: Form, questions: QuestionType[]) {
  try {
    const req = await api.post(
      `/forms/create`,
      { form, questions: questions }
    );
    return req.data;
  } catch (err) {
    console.log(err);
  }
}
export async function updateeForm(
  form: Form,
  questions: QuestionType[],
  formId: number
) {
  try {
    const req = await api.put(
      `/forms/update/${formId}`,
      { form, questions: questions }
    );
    return req.data;
  } catch (err) {
    console.log(err);
  }
}
export async function deleteTaskAssignmentUser(id: any) {
  try {
    const req = await api.delete(
      `/task-assignments/${id}`
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function deleteTaskAssignmentOccurrence(id: number) {
  try {
    const res = await api.delete(
      `/task-assignments/occurrence/${id}`
    );
    return res.data;
  } catch (err: any) {
    console.error(err);
    return err.response?.data;
  }
}
export async function createFeedback(feedbackData: any) {
  try {
    const response = await api.post(
      `/feedback`,
      feedbackData
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.message || "שגיאה ביצירת המשוב",
      };
    }
    return { success: false, error: "שגיאה ביצירת המשוב" };
  }
}
export async function updateFeedaback(feedbackData: any, feedbackId: number) {
  try {
    const response = await api.put(
      `/feedback/${feedbackId}`,
      feedbackData
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error update feedback:", error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.message || "שגיאה בעדכון המשוב",
      };
    }
    return { success: false, error: "שגיאה בעדכון המשוב" };
  }
}
export async function getFeedbackByFeedbackId(feedbackId: number) {
  try {
    const response = await api.get(
      `/feedback/${feedbackId}`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error get feedback:", error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.message || "שגיאה בשליפת המשוב",
      };
    }
    return { success: false, error: "שגיאה בשליפת המשוב" };
  }
}

export const getFeedbackStatus = async (taskAssignmentId: number | string) => {
  try {
    const response = await api.get(
      `/feedback/feedback-status/${taskAssignmentId}`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error fetching feedback status:", error);
    return {
      success: false,
      error: error.response?.data?.message || "שגיאה בשליפת סטטוס המשוב",
    };
  }
};

export async function updateFeedbackAnswer(
  feedbackId: number,
  feedbackData: any,
  dataToTeamMemberId: {
    semesterId: number;
    teamId: number;
    userId: number;
  }
) {
  try {
    const response = await api.put(
      `/feedback/updateFeedbackComplete/${feedbackId}`,
      feedbackData,
      { params: dataToTeamMemberId }
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.message || "שגיאה בעדכון המשוב",
      };
    }
    return { success: false, error: "שגיאה בעדכון המשוב" };
  }
}
export async function updateFeedbackIsViewable(
  feedbackId: number,
  taskAssignementId: number | undefined,
  teamMemberId: number,
  isViewable: boolean
) {
  try {
    const response = await api.put(
      `/feedback/updateFeedbackAnswerViewable/${feedbackId}`,
      {
        task_assignment_id: taskAssignementId,
        team_member_id: teamMemberId,
        isViewable,
      }
    );
    if (response.status === 200) {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.memberLists() });
    }
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.message || "שגיאה בעדכון המשוב",
      };
    }
    return { success: false, error: "שגיאה בעדכון המשוב" };
  }
}

export async function createFormSubmission(data: any) {
  try {
    const req = await api.post(
      `/formSubmissions`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function putFormSubmission(data: any, id: number) {
  try {
    const req = await api.put(
      `/formSubmissions/${id}`,
      data
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function getFormSubmissionsAnswers(id: number) {
  try {
    const req = await api.get(
      `/formSubmissionsAnswers/${id}`
    );

    return req.data;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function createFormSubmissionsAnswer(data: any) {
  try {
    const req = await api.post(
      `/formSubmissionsAnswers`,
      data,
      {
        withCredentials: true,
      }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function putFormSubmissionsAnswer(data: any, id: number) {
  try {
    const req = await api.put(
      `/formSubmissionsAnswers/${id}`,
      data
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function createGradeStage(data: {
  name: string;
  courseid: number;
}) {
  try {
    const req = await api.post(
      `/gradeStages/create`,
      data
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function deleteGradeStage(data: { id: number }) {
  try {
    const req = await api.delete(
      `/gradeStages/delete`,
      { headers: data }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function updateGradeStage(data: { id: number; name: string }) {
  try {
    const req = await api.put(
      `/gradeStages/update`,
      data
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function createTag(data: { name: string; courseid: number }) {
  try {
    const req = await api.post(
      `/tag/create`,
      data
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function deleteTag(data: { id: number }) {
  try {
    const req = await api.delete(
      `/tag/delete`,
      { headers: data }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function updateTag(data: { id: number; name: string }) {
  try {
    const req = await api.put(
      `/tag/update`,
      data
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}

export async function getTasksByUser(
  userId: number | null,
  teamId: number | null,
  selectedPermission: string | undefined,
  courseBatchId?: number | null,
  skipVisibility: boolean = false,
  startFilter?: Dayjs,
  endFilter?: Dayjs
) {
  try {
    const response = await api.get(
      `/tasks/getTasksByUser`,
      {
        params: {
          userId: userId,
          teamId: teamId,
          courseBatchId: courseBatchId,
          skipVisibility: skipVisibility,
          withCredentials: true,
          startFilter,
          endFilter,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}
export async function getTasksBySemester(
  teamId: Number[],
  selectedCourseBatch: number
) {
  try {
    const response = await api.get(
      `/tasks/getTasksBySemester`,
      {
        params: {
          teamId: teamId,
          selectedCourseBatch: selectedCourseBatch,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}
export async function getTasksByTeam(
  teamId: Number,
  selectedCourseBatch: number
) {
  try {
    const response = await api.get(
      `/tasks/getTasksByTeam`,
      {
        params: {
          teamId: teamId,
          selectedCourseBatch: selectedCourseBatch,
          withCredentials: true,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}
export async function getOpenFeedbackBySemester(
  teamId: Number[],
  selectedCourseBatchId: number
) {
  try {
    const response = await api.get(
      `/feedback/getOpenFeedback/bySemester`,
      {
        params: {
          teamId: teamId,
          selectedCourseBatchId: selectedCourseBatchId,
          withCredentials: true,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    throw error;
  }
}
export async function getOpenFeedbackByTeam(
  teamId: Number,
  selectedCourseBatchId: number
) {
  try {
    const response = await api.get(
      `/feedback/getOpenFeedback/byTeam`,
      {
        params: {
          teamId: teamId,
          selectedCourseBatchId: selectedCourseBatchId,
          withCredentials: true,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    throw error;
  }
}
export async function getGradeStageProgressByTeam(
  teamId: Number,
  selectedCourseBatch: number
) {
  try {
    const response = await api.get(
      `/tasks/getGradeStageProgressByTeam`,
      {
        params: {
          teamId: teamId,
          selectedCourseBatch: selectedCourseBatch,
          withCredentials: true,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    throw error;
  }
}
export async function deleteTask(taskId: number): Promise<any> {
  try {
    const response = await api.delete(
      `/tasks/${taskId}`,
      {
        withCredentials: true,
      }
    );

    return {
      success: true,
      message: response.data?.message ?? "Task deleted",
    };
  } catch (err) {
    const axiosErr = err as any;
    const status = axiosErr?.response?.status;
    const msg = axiosErr?.response?.data?.message ?? axiosErr.message;

    console.error(`deleteTask – id:${taskId} – ${msg}`, axiosErr);
    return {
      success: false,
      message: `Error ${status ?? ""}: ${msg}`,
    };
  }
}
export async function duplicateTask(taskId: number): Promise<any> {
  try {
    const response = await api.post(
      `/tasks/duplicate/${taskId}`,
      {
        withCredentials: true,
      }
    );

    return {
      success: true,
      message: response.data?.message ?? "Task copy",
    };
  } catch (err) {
    const axiosErr = err as any;
    const status = axiosErr?.response?.status;
    const msg = axiosErr?.response?.data?.message ?? axiosErr.message;

    return {
      success: false,
      message: `Error ${status ?? ""}: ${msg}`,
    };
  }
}

export async function updateTemplateAxis(template: AxisTemplate) {
  try {
    const req = await api.put(
      `/axisTemplate/update`,
      template
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function createTemplateAxis(template: AxisTemplate) {
  try {
    const req = await api.post(
      `/axisTemplate/create`,
      { ...template, createdAt: new Date(), updatedAt: new Date() }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function getTemplateAxisByAxisId(axisId: number) {
  try {
    const req = await api.get(
      `/axisTemplate/get-by-axisId`,
      { params: { axisId } }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function getMemberByBatchId(courseBatchId: number) {
  try {
    const req = await api.get(
      `/teamMembers/getMembersByCourseBatch/${courseBatchId}`
    );
    return req.data;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function getTemplateByAxisId(
  axisId: number
): Promise<AxisTemplate[] | undefined> {
  try {
    const response = await api.get<AxisTemplate[]>(
      `/axisTemplate/get-by-axisId`,
      {
        params: { axisId },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching AxisTemplate:", error);
    return error?.response?.data;
  }
}
/* export async function getRoles(): Promise<Role[]> {
  try {
    const response = await axios.get<Role[]>(
      `${process.env.REACT_APP_API_BASE_URL}/roles`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    return error?.response?.data;
  }
} */

export async function confirmTaskById(id: number) {
  try {
    const req = await api.put(
      `/tasks/confirmTask/${id}`
    );
    queryClient.invalidateQueries({
      queryKey: ["tasksByTeamIds"],
    });
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export async function markTaskAsCompleted(taskAssignmentId: number | string) {
  try {
    const response = await api.put(
      `/task-assignments/${taskAssignmentId}/complete`
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error marking task as completed:", error);

    return {
      success: false,
      message: error.response?.data?.message || "אירעה שגיאה",
    };
  }
}

export const cancelTaskSubmission = async (
  taskAssignmentId: number | string
) => {
  try {
    const response = await api.put(
      `/task-assignments/${taskAssignmentId}/cancel`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "שגיאה",
    };
  }
};

export const toggleFeedbackActive = async (feedbackId: number | string) => {
  try {
    const response = await api.put(
      `/feedback/${feedbackId}/toggle-active`
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Error toggling feedback active:", error);
    return {
      success: false,
      message: error.response?.data?.message || "אירעה שגיאה",
    };
  }
};
export const toggleFormActive = async (formId: number | string) => {
  try {
    const response = await api.put(
      `/forms/${formId}/toggle-active`
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Error toggling form active:", error);
    return {
      success: false,
      message: error.response?.data?.message || "אירעה שגיאה",
    };
  }
};
export const createTeamEventAssignment = async (
  teamEventAssignment: Omit<TeamEventAssignment, "id">
) => {
  const response = await api.post(
    `/teamEventsAssignment`,
    teamEventAssignment
  );
  return response.data;
};
export const removeTeamEventAssignment = async (id: number) => {
  const response = await api.delete(
    `/teamEventsAssignment/${id}`
  );
  return response.data;
};
export const toggleFormDuplicate = async (formId: number | string) => {
  try {
    const response = await api.post(
      `/forms/duplicate/${formId}`
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Error toggling form active:", error);
    return {
      success: false,
      message: error.response?.data?.message || "אירעה שגיאה",
    };
  }
};

export const blockTasksForStudents = async (
  teamId: number,
  courseBatchId: number,
  fromISO: string,
  toISO: string
) => {
  const payload = { teamId, courseBatchId, fromISO, toISO };
  try {
    const response = await api.put(
      `/teamCourseBatch/updateDate`,
      payload
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Error update dates form:", payload);
    return {
      success: false,
      message: error.response?.data?.message || "אירעה שגיאה",
    };
  }
};
export const fetchBlockedDates = async (
  teamId: number,
  courseBatchId: number
) => {
  try {
    const resp = await api.get(
      `/teamCourseBatch/getByTeamAndCourseBatchIds/${teamId}/${courseBatchId}`
    );
    const record = resp.data?.data?.[0] ?? null;
    return record;
  } catch (error: any) {
    console.error("Error get dates form:", teamId, courseBatchId);
    return {
      success: false,
      message: error.response?.data?.message || "אירעה שגיאה",
    };
  }
};
export const resetBlockedPeriod = async (
  teamId: number,
  courseBatchId: number
) => {
  await api.delete(
    `/teamCourseBatch/removeDates`,
    {
      data: { teamId, courseBatchId },
    }
  );
};
export async function getTeamCompletedTasks(
  teamId: Number,
  courseBatchId: number
) {
  try {
    const response = await api.get(
      `/task-assignments/getTeamCompletedTasks`,
      {
        params: {
          teamId: teamId,
          courseBatchId: courseBatchId,
          withCredentials: true,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
}

export async function getDuplicatedTasks(
  teamId: Number,
  courseBatchId: number
) {
  try {
    const response = await api.get(
      `/task-assignments/getDuplicatedTasks`,
      {
        params: {
          teamId: teamId,
          selectedCourseBatch: courseBatchId,
          withCredentials: true,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching assignmentsOccurrence:", error);
    throw error;
  }
}

export const fetchBlockColorSetting = async (
  teamId: string,
  batchId: string
): Promise<BlockColorResponse> => {
  try {
    const response = await api.get<BlockColorResponse>(
      `/teamCourseBatch/byTeam/${teamId}/batch/${batchId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("🔴 Fetch block color error:", error.message);
      throw new Error(
        error.response?.data?.message || "Failed to fetch block color setting"
      );
    }
    throw error;
  }
};

export const updateBlockColorSetting = async ({
  teamId,
  courseBatchId,
  isBlockColorDto,
}: BlockColorUpdateParams): Promise<void> => {
  try {
    await api.put(
      `/teamCourseBatch/updateBlockColorByTeam`,
      { teamId, courseBatchId, isBlockColorDto },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("🔴 Update block color error:", error.message);
      throw new Error(
        error.response?.data?.message || "Failed to update block color setting"
      );
    }
    throw error;
  }
};

export const COLORS = [
  "#940000",
  "#FE3502",
  "#FF7001",
  "#FAA201",
  "#FEFC00",
  "#C2BD6A",
  "#CDEBA3",
  "#AEDB00",
  "#02ABC4",
  "#00CC87",
  "#009791",
  "#009B00",
  "#015500",
  "#142A79",
  "#004AA3",
  "#0077F9",
  "#2EBBF9",
  "#A2D5ED",
  "#8900C7",
  "#9255AB",
  "#B8ABEF",
  "#380059",
  "#630095",
  "#FD9CB3",
];

export const getTeamAxisOrder = async (
  courseBatchId: number,
  teamId: number
) => {
  const response = await api.get(
    `/team-axis-order`,
    {
      params: { courseBatchId, teamId },
    }
  );
  return response.data;
};

export const updateAxisOrder = async (
  courseBatchId: number,
  teamId: number,
  axisIds: number[]
): Promise<void> => {
  await api.post(`/team-axis-order`, {
    courseBatchId,
    teamId,
    axisIds,
  });
};

// // שליפת צירים עם סדר
// export const getAxesOrdered = async (
//   courseBatchId: number,
//   teamId: number,
//   repositoryKind: string
// ) => {
//   const response = await axios.get("/api/team-axis-order/axes", {
//     params: { courseBatchId, teamId, repositoryKind },
//   });
//   return response.data;
// };

// // מחיקת סדר
// export const deleteAxisOrder = async (
//   courseBatchId: number,
//   teamId: number
// ): Promise<void> => {
//   await axios.delete("/api/team-axis-order", {
//     params: { courseBatchId, teamId },
//   });
// };

export const fetchTeamQueueTasks = async (
  teamId: number,
  course_batch_id: number,
  startDate?: string,
  endDate?: string | undefined,
  isTeamMemberV?: boolean,
  selectedTeamMember?: number
) => {
  try {
    let url = "";

    if (isTeamMemberV && selectedTeamMember) {
      url = `/queue/team/${teamId}/${course_batch_id}/member/${selectedTeamMember}`;
    } else {
      url = `/queue/team/${teamId}/${course_batch_id}`;

      if (startDate && endDate) {
        url += `/${startDate}/${endDate}`;
      }
    }

    const response = await api.get(url);

    return response.data;
  } catch (error) {
    console.error("Error fetching team queue tasks:", error);
    return { success: false, data: [] };
  }
};
export const checkTaskAssignmentExists = async (
  taskId: number,
  teamId: number
): Promise<boolean> => {
  const response = await api.get(
    `/task-assignments/exists`,
    {
      params: {
        taskId,
        teamId,
      },
    }
  );
  return response.data.exists;
};
export const checkUserTaskAssignmentExists = async (
  taskId: number,
  teamId: number,
  teamMemberId: number
): Promise<boolean> => {
  const response = await api.get(
    `/task-assignments/UserExists`,
    {
      params: {
        taskId,
        teamId,
        teamMemberId,
      },
    }
  );
  return response.data.exists;
};

export async function saveHoefsForTask(taskAssignmentId: any, hoefs: any[]) {
  try {
    const req = await api.post(
      `/hoefs/${taskAssignmentId}`,
      { hoefs },
      { withCredentials: true }
    );
    return req;
  } catch (error: any) {
    console.log(error);
    return error.response;
  }
}
export const fetchCourseBatchFiles = async (courseBatchId: number) => {
  const response = await api.get(
    `/files/filesByCourseBatchId`,
    {
      headers: {
        courseBatchId,
      },
    }
  );
  return response.data;
};
export const getCourseBatchFolders = async (
  courseBatchId: number,
  teamId?: number,
  teamMemberId?: number
) => {
  return await api.get("/course-batch-folders", {
    headers: {
      coursebatchid: courseBatchId,
      ...(teamId ? { teamid: teamId } : {}),
      ...(teamMemberId ? { teammemberid: teamMemberId } : {}),
    },
  });
};
export const createCourseBatchFolder = async (payload: {
  course_batch_id: number;
  name: string;
  color?: string;
  repository_kind?: string;
  team_id?: number;
  team_member_id?: number;
}) => {
  const response = await api.post("/course-batch-folders", payload);
  return response.data;
};
export async function deleteCourseBatchFolder(folderId: number) {
  try {
    const response = await api.delete(
      `/course-batch-folders/${folderId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting folder:", error);
    return error.response;
  }
}
export async function getFolderFiles(folderId: number) {
  try {
    const response = await api.get(
      `/course-batch-folder-files/folder/${folderId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching folder files:", error);
    return [];
  }
}

export async function uploadFileToFolder(
  folderId: number,
  file: File,
  s3Key: string,
  bucket: string,
  onProgress?: (progress: number) => void
) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder_id", folderId.toString());
    formData.append("key", s3Key);
    formData.append("bucket", bucket);
    formData.append("original_filename", encodeURIComponent(file.name));

    const response = await api.post(
      `/course-batch-folder-files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

export async function deleteFolderFile(fileId: number) {
  try {
    const response = await api.delete(
      `/course-batch-folder-files/${fileId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

export const getHoefTeamSummary = async (teamId: number): Promise<any[]> => {
  const response = await api.get(
    `/hoefs/team/${teamId}/summary`
  );
  return response.data.data;
};

export const getQueueTasksByMemberFlat = async (
  teamId: number,
  courseBatchId: number,
  memberId: number
): Promise<any[]> => {
  try {
    const response = await api.get(
      `queue/team-queue/${teamId}/${courseBatchId}/${memberId}/flat`
    );
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching queue tasks flat:", error);
    return [];
  }
};

export async function GetNoteBookFolders(params: {
  courseBatchId?:number | null,
  teamId?: number | null;
  team_member_id?: number | null;
}): Promise<any> {
  let res: any;
  try {
    res = await api.get(
      `/notebook/folders`,
      {
        params,
        withCredentials: true,
      }
    );
  } catch (error) {
    console.log(error);
  }
  return res;
}
export async function GetNoteBookNotes(folderId: number): Promise<any> {
  let res: any;
  try {
    res = await api.get(
      `/notebook/folders/${folderId}/notes`,
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.log(error);
  }
  return res;
}
// עדכון פתק קיים — באותו פורמט של GetNoteBookNotes
export const UpdateNoteBookNote = async (
  noteId: number,
  payload: { title: string; content: any }
): Promise<any> => {
  let res: any;
  try {
    res = await api.put(
      `/notebook-notes/${noteId}`,
      payload,
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.log(error);
  }
  return res;
};

// יצירת פתק חדש
export const CreateNoteBookNote = async (payload: {
  folder_id: number | null;
  title: string;
  content?: any;
  parent_note_id?: number | null;
  created_by?: number;
}): Promise<any> => {
  let res: any;
  try {
    res = await api.post(
      `/notebook-notes`,
      payload,
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.log(error);
  }
  return res;
};

export const DeleteNoteBookFolder = async (folderId: number): Promise<any> => {
  let res: any;
  try {
    res = await api.delete(
      `/notebook/folders/${folderId}`,
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.log(error);
  }
  return res;
};


export const CreateNoteBookFolder = async (payload: {
  name: string;
  teamId: number | null;
  courseBatchId: number | null;
  team_member_id?: number | null;
  system_key?: string | null;
}): Promise<any> => {
  let res: any;
  try {
    res = await api.post(
      `/notebook/folders`,
      payload,
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.log(error);
  }
  return res;
};
export const DeleteNoteBookNote = async (noteId: number): Promise<any> => {
  let res: any;
  try {
    res = await api.delete(
      `/notebook-notes/${noteId}`,
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.log(error);
  }
  return res;
};
export const updateCourseBatchFolder = async (folderId: number, data: { name: string }) => {
  const response = await api.put(`/course-batch-folders/${folderId}`, data);
  return response.data;

};