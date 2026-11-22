import React, { useState, useMemo, useEffect } from "react";
import style from "./FeedbackForm.module.css";
import { useFeedbackForm } from "../../../../hooks/useGetFeedbackFormForAssignment";
import { Button, message } from "antd";
import {
  getTasksByUser,
  updateFeedbackAnswer,
} from "../../../../services/ApiServices";
import UploadFiles from "../../../../components/NewTaskModal/Inputs/UploadFiles/UploadFiles";
import { CheckOutlined } from "@ant-design/icons";
import TaskAssignmentCard from "../TaskAssignmentCard/TaskAssignmentCard";
import UserSelector from "../UserSelector/UserSelector";
import {
  updateFiles,
  uploadFilesToS3,
  useTaskStore,
} from "../../../../store/taskStore";
import { useFetchFilesByFeedbackAnswerId } from "../../../../hooks/useFetchFilesByFeedbackAnswerId";
import Notification from "../../../../UI/Notification/Notification";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import BlackButton from "../../../../UI/Button/BlackButton";
import { usePermissionStore } from "../../../../store/permissionStore";
import { UserTaskModal } from "../../../../components/LazyTaskModals";
import dayjs from "dayjs";
import { useSelectionsStore } from "../../../../store/selectionStore";
import { useUserStore } from "../../../../store/userStore";
import { feedbackKeys } from "../../../../api/queryKeys";

interface Category {
  id: number;
  name: string;
  selection_type: string | null;
}
interface Question {
  question_text: string;
  answer: string;
  question_id: number;
}
interface FormDataItem {
  taskAssignmentId: number;
  select_option_score: number;
  taskName: string | null;
  feedbackName: string | null;
  userName: string;
  userId: number | null;
  userEmail: string | null;
  militaryid: string;
  categories: Category[];
  questions: Question[];
  comment: string;
  hasUserAnswered: boolean;
  finelScore: number;
  selectedOptionLabel: string;
  feedbackId: number;
  categoryComment: string;
  seenGrade: boolean;
  leaders_only_comment: string;
  feedbackAnswerIsViewable: boolean;
}

interface BaseTask {
  id: number;
  name: string;
  gn: string;
  color: string;
  status: string;
  creatorName: string;
  creatorUsername: string;
}

interface FlatTask extends BaseTask {
  taskId: number;
  task_id?: any;
  most_frequent_assigned_at_start: string;
  most_frequent_assigned_at_end: string;
  source?: string;
  completed: string | null;
  completed_at: string | null;
  taskassignmentid: number;
}
type Props = {
  taskId: string | undefined;
  dates: string[];
  assignmentIds: string[];
};
const FeedbackForm: React.FC<Props> = (props) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { selectedPermission } = usePermissionStore();
  const { user } = useUserStore();
  const [missionData, setMissionData] = useState<any>();
  const [openUserModal, setOpenUserModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const { selectedCourseBatch, selectedTeam } = useSelectionsStore();
  const teamId = selectedTeam?.id;
  const semesterId = selectedCourseBatch?.id;
  const userId = user?.id;
  const [selectedTaskAssignmentId, setSelectedTaskAssignmentId] = useState<
    number | null
  >(null);

  const { taskId: taskIdStr, teamId: teamIdStr } = useParams();

  const {
    data: formData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFeedbackForm(taskIdStr, teamIdStr, props.dates, props.assignmentIds);

  useEffect(() => {
    refetch();
    const handleFocus = () => refetch();
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  const taskInStore = useTaskStore((state) => state.task);

  const userTaskAssignments = useMemo<FormDataItem[] | null>(() => {
    if (!formData?.data || selectedUserId === null) return null;
    return formData.data.filter(
      (item: FormDataItem) => item.userId === selectedUserId
    );
  }, [formData, selectedUserId]);

  function transformMission(m: any): any {
    const f = m as FlatTask;

    return {
      id: f?.id,
      title: f?.name,
      start: dayjs(f?.most_frequent_assigned_at_start).toISOString(),
      end: dayjs(f?.most_frequent_assigned_at_end).toISOString(),
      allDay: false,
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: "black",
      extendedProps: {
        groupName: f?.gn,
        taskColor: f?.color,
        source: f?.source,
        status: f?.status,
        creatorName: f?.creatorName,
        creatorUsername: f?.creatorUsername,
        completed_at: f?.completed_at,
        completed: f?.completed,
        taskassignmentid: f?.taskassignmentid,
        task_id: f?.taskId || f?.task_id,
      },
    };
  }

  useEffect(() => {
    const fetchData = async () => {
      if (userTaskAssignments) {
        const skipVisibility = selectedPermission?.role_code !== "STUDENT";

        const data = await getTasksByUser(
          Number(userTaskAssignments[0]?.userId),
          selectedTeam?.id ? Number(selectedTeam?.id) : null,
          selectedPermission?.role_code,
          selectedCourseBatch.id,
          skipVisibility
        );

        setMissionData(data);

        if (selectedEvent?.id) {
          const taskAssignmentId = selectedEvent?.id;
          const updatedTask = data.find((t: any) => t.id === taskAssignmentId);

          if (updatedTask) {
            setSelectedEvent((prev: any) => ({
              ...prev,
              extendedProps: {
                ...prev.extendedProps,
                completed_at: updatedTask.completed_at,
              },
            }));
          }
        }
      }
    };
    fetchData();
  }, [userTaskAssignments, selectedPermission?.role_code, refreshCount]);

  useEffect(() => {
    if (selectedUserId !== null) {
      setSelectedTaskAssignmentId(null);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (
      userTaskAssignments &&
      userTaskAssignments.length > 0 &&
      selectedTaskAssignmentId === null
    ) {
      setSelectedTaskAssignmentId(userTaskAssignments[0].taskAssignmentId);
    }
  }, [userTaskAssignments, selectedTaskAssignmentId]);

  const [categoryStatus, setCategoryStatus] = useState<
    Record<number, Record<number, "improvement" | "preservation" | null>>
  >({});

  const [comments, setComments] = useState<Record<number, string>>({});
  const [leadersOnlyComment, setLeadersOnlyComment] = useState<
    Record<number, string>
  >({});
  const [finalScores, setFinalScores] = useState<Record<number, number | null>>(
    {}
  );
  const [feedbackAnswerIsViewable, setFeedbackAnswerIsViewable] =
    useState<boolean>(true);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<number, Record<number, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [taskReletedFiles, setTaskReletedFiles] = useState<any[]>();
  const [selectedOptionLabel, setSelectedOptionLabel] = useState<string | null>(
    ""
  );
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const selectedTask = useMemo(() => {
    if (!missionData || !selectedTaskAssignmentId) return null;
    return missionData.find(
      (mission: any) =>
        mission.id === selectedTaskAssignmentId ||
        mission.task_assignment_id === selectedTaskAssignmentId
    );
  }, [missionData, selectedTaskAssignmentId]);

  const isFutureTask = !selectedTask;

  const handleCategoryClick = (
    taskAssignmentId: number,
    categoryId: number
  ) => {
    setCategoryStatus((prev) => {
      const currentStatus = prev[taskAssignmentId]?.[categoryId];

      let newStatus: "improvement" | "preservation" | null = null;

      if (currentStatus === null || currentStatus === undefined) {
        newStatus = "improvement";
      } else if (currentStatus === "improvement") {
        newStatus = "preservation";
      } else {
        newStatus = null;
      }

      return {
        ...prev,
        [taskAssignmentId]: {
          ...prev[taskAssignmentId],
          [categoryId]: newStatus,
        },
      };
    });
  };

  const handleCommentChange = (taskAssignmentId: number, comment: string) => {
    setComments((prev) => ({
      ...prev,
      [taskAssignmentId]: comment,
    }));
  };
  const handleLedearsCommentChange = (
    taskAssignmentId: number,
    comment: string
  ) => {
    setLeadersOnlyComment((prev) => ({
      ...prev,
      [taskAssignmentId]: comment,
    }));
  };

  const handleFinalScoreChange = (
    taskAssignmentId: number,
    score: number | null
  ) => {
    setFinalScores((prev) => ({
      ...prev,
      [taskAssignmentId]: score,
    }));
  };
  const handleChangeFeedbackIsViewable = () => {
    setFeedbackAnswerIsViewable((prev) => !prev);
  };

  const handleQuestionAnswerChange = (
    taskAssignmentId: number,
    questionIndex: number,
    answer: string
  ) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [taskAssignmentId]: {
        ...prev[taskAssignmentId],
        [questionIndex]: answer,
      },
    }));
  };

  const uniqueUsers = useMemo<
    { id: number; name: string; email: string }[]
  >(() => {
    if (!formData?.data) return [];

    const usersMap = new Map<
      number,
      { id: number; name: string; email: string }
    >();
    formData.data.forEach((item: FormDataItem) => {
      if (item.userId && item.userName) {
        usersMap.set(item.userId, {
          id: item.userId,
          name: item.userName,
          email: item.userEmail || "",
        });
      }
    });

    return Array.from(usersMap.values());
  }, [formData]);

  useEffect(() => {
    if (uniqueUsers.length > 0 && selectedUserId === null) {
      setSelectedUserId(uniqueUsers[0].id);
    }
  }, [uniqueUsers, selectedUserId]);

  useEffect(() => {
    if (
      formData?.data &&
      userTaskAssignments &&
      userTaskAssignments.length > 0
    ) {
      const initialStatus: Record<
        number,
        Record<number, "improvement" | "preservation" | null>
      > = {};
      const initialComments: Record<number, string> = {};
      const initialLeadersComments: Record<number, string> = {};
      let initialFeedbackAnswerIsViewable: boolean = true;
      const initialFinalScores: Record<number, number | null> = {};
      const initialSelectedOptionLabel: Record<number, string | null> = {};
      const initialQuestionAnswers: Record<number, Record<number, string>> = {};
      userTaskAssignments.forEach((taskAssignment) => {
        const taskAssignmentId = taskAssignment.taskAssignmentId;
        initialStatus[taskAssignmentId] = {};
        initialQuestionAnswers[taskAssignmentId] = {};

        taskAssignment.categories.forEach((category) => {
          const selectionType = category.selection_type as
            | "improvement"
            | "preservation"
            | null;
          initialStatus[taskAssignmentId][category.id] = selectionType;
        });

        taskAssignment.questions.forEach((question, index) => {
          initialQuestionAnswers[taskAssignmentId][index] =
            question.answer || "";
        });

        initialFeedbackAnswerIsViewable =
          taskAssignment.feedbackAnswerIsViewable !== undefined
            ? taskAssignment.feedbackAnswerIsViewable
            : true;

        initialComments[taskAssignmentId] = taskAssignment.comment;
        initialLeadersComments[taskAssignmentId] =
          taskAssignment.leaders_only_comment;
        initialFinalScores[taskAssignmentId] = taskAssignment.finelScore;

        initialSelectedOptionLabel[taskAssignmentId] =
          taskAssignment.selectedOptionLabel;
      });

      setSelectedOptionLabel(
        initialSelectedOptionLabel[userTaskAssignments?.[0]?.taskAssignmentId]
      );
      setFeedbackAnswerIsViewable(initialFeedbackAnswerIsViewable);
      setCategoryStatus(initialStatus);
      setComments(initialComments);
      setLeadersOnlyComment(initialLeadersComments);
      setFinalScores(initialFinalScores);
      setQuestionAnswers(initialQuestionAnswers);
    }
  }, [userTaskAssignments]);

  const { data: feedbackFiles } = useFetchFilesByFeedbackAnswerId(
    userTaskAssignments?.[0]?.taskAssignmentId
  );

  useEffect(() => {
    if (Array.isArray(feedbackFiles) && feedbackFiles.length > 0) {
      setTaskReletedFiles(feedbackFiles);
    } else {
      setTaskReletedFiles([]);
    }
  }, [feedbackFiles]);

  const handleSaveFeedback = async () => {
    if (!userTaskAssignments || userTaskAssignments.length === 0) {
      message.error("No assignments found to save");
      return;
    }
    if (!semesterId || !teamId || !userId) {
      message.error("No trainee found ");
      return;
    }
    if (
      Object.keys(categoryStatus).length === 0 ||
      !Object.values(categoryStatus).some((inner) =>
        Object.values(inner).some((v) => v !== null)
      )
    ) {
      Notification({ type: "error", msg: "יש לבחור קטגוריות" });
      return;
    }
    const commentsValue = Object.values(comments);
    const comentsFromOBJ = commentsValue[0];
    if (comentsFromOBJ.trim().length === 0 || comentsFromOBJ === "") {
      Notification({ type: "error", msg: "יש לכתוב הערה " });
      return;
    }

    const values = Object.values(finalScores);
    const v = values[0];
    if (typeof v !== "number")
      return Notification({ type: "error", msg: "יש לתת ציון" });

    setIsSaving(true);

    try {
      const feedbackData = userTaskAssignments.map((taskAssignment) => ({
        task_assignment_id: taskAssignment.taskAssignmentId,
        userId: taskAssignment.userId,
        userName: taskAssignment.userName,
        categories: taskAssignment.categories.map((category) => ({
          feedback_id: taskAssignment.feedbackId,
          category_id: category.id,
          task_assignment_id: taskAssignment.taskAssignmentId,
          selection_type:
            categoryStatus[taskAssignment.taskAssignmentId]?.[category.id] ||
            null,
        })),
        comment: comments[taskAssignment.taskAssignmentId] || "",
        leaders_only_comment:
          leadersOnlyComment[taskAssignment.taskAssignmentId] || "",
        finalScore: finalScores[taskAssignment.taskAssignmentId] ?? null,
        selectedOptionLabel: selectedOptionLabel || null,
        answers: taskAssignment.questions
          .map((q, index) => {
            const answer =
              questionAnswers[taskAssignment.taskAssignmentId]?.[
                index
              ]?.trim() || "";
            return {
              question_id: q.question_id,
              questionIndex: index,
              task_assignment_id: taskAssignment.taskAssignmentId,
              answer,
            };
          })
          .filter((a) => a.answer.trim().length > 0),
        isViewable: feedbackAnswerIsViewable,
      }));
      const dataToTeamMemberId = {
        semesterId: semesterId,
        teamId: teamId,
        userId: userId,
      };
      const result = await updateFeedbackAnswer(
        userTaskAssignments[0].feedbackId,
        feedbackData[0],
        dataToTeamMemberId
      );
      await uploadFiles(null, result?.data?.data?.id);

      message.success("Feedback saved successfully!");
    } catch (saveError) {
      console.error("Error saving feedback:", saveError);
      message.error("Failed to save feedback");
    } finally {
      setIsSaving(false);
      queryClient.refetchQueries({
        queryKey: ["feedbackForm"],
      });
      queryClient.refetchQueries({
        queryKey: ["feedbackcourseId"],
      });
      queryClient.refetchQueries({
        queryKey: feedbackKeys.memberLists(),
      });
      queryClient.refetchQueries({
        queryKey: feedbackKeys.byAssignmentAll(),
      });
      setTimeout(() => {
        navigate("/feedbackDashboard");
      }, 2000);
    }
  };

  // מה??
  const setMissionCompleted = (missionKey: string, completed: boolean) => {
    /*  setCompletedMissions((prev) => ({
      ...prev,
      [missionKey]: completed,
    })); */
  };

  const uploadFiles = async (
    taskId: number | null,
    feedback_answer_id: number | null
  ) => {
    const newFiles: File[] = [];

    if (taskInStore.filesPathes && taskInStore.filesPathes?.length > 0) {
      for (const f of taskInStore.filesPathes) {
        if (f instanceof File) {
          newFiles.push(f);
        }
      }
    }
    if (newFiles.length === 0) {
      console.log("No new files to upload");
      return;
    }

    try {
      console.log("Start Saving Files...");
      const files = newFiles.map((f) => {
        return new File([f], encodeURIComponent(f.name), {
          type: f.type,
          lastModified: f.lastModified,
        });
      });

      await uploadFilesToS3(files, taskId, feedback_answer_id);
      console.log("Finish Saving Files:)");
    } catch (error) {
      console.log("Failed Saving Files:(");
    }
  };

  if (isLoading) {
    return <div className={style.container}>Loading...</div>;
  }
  if (isError) {
    return (
      <div className={style.container}>
        <p>Error: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className={style.container}>
      <div className={style.headerContainer}>
        <div className={style.headerContainer}>
          <UserSelector
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            uniqueUsers={uniqueUsers}
            userTaskAssignment={userTaskAssignments?.[0]}
          />

          {isFutureTask ? (
            <div className={style.futureTaskTag}>זמן המשימה עדיין לא הגיע</div>
          ) : (
            <Button
              className={style.missionButton}
              onClick={() => {
                const item = missionData?.find(
                  (mission: any) =>
                    mission.id === selectedTaskAssignmentId ||
                    mission.task_assignment_id === selectedTaskAssignmentId
                );

                if (item) {
                  setSelectedEvent(item);
                  setOpenUserModal(true);
                } else {
                  message.error("לא נמצאה משימה");
                }
              }}
            >
              ראה משימה
            </Button>
          )}
        </div>
        {userTaskAssignments?.[0]?.hasUserAnswered && (
          <>
            <div
              style={{
                width: "20%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800 }}>
                המשוב נשלח בהצלחה
                <CheckOutlined style={{ marginRight: 12 }} />
              </span>
            </div>
          </>
        )}
      </div>

      <div className={style.userAssignmentContainer}>
        {userTaskAssignments && userTaskAssignments.length > 0 ? (
          userTaskAssignments.map((taskAssignment) => (
            <TaskAssignmentCard
              key={taskAssignment.taskAssignmentId}
              taskAssignment={taskAssignment}
              categoryStatus={categoryStatus}
              comments={comments}
              finalScores={finalScores}
              questionAnswers={questionAnswers}
              onCategoryClick={handleCategoryClick}
              onCommentChange={handleCommentChange}
              onFinalScoreChange={handleFinalScoreChange}
              onQuestionAnswerChange={handleQuestionAnswerChange}
              selectedOptionLabel={selectedOptionLabel}
              setSelectedOptionLabel={setSelectedOptionLabel}
              seenGrade={taskAssignment.seenGrade}
              handleLedearsCommentChange={handleLedearsCommentChange}
              leadersOnlyComment={leadersOnlyComment}
              feedbackAnswerIsViewable={feedbackAnswerIsViewable}
              handleChangeFeedbackIsViewable={handleChangeFeedbackIsViewable}
            />
          ))
        ) : (
          <p>No assignments found for the selected user.</p>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <span>צירוף מסמכים אופציונאלי</span>
        <UploadFiles
          onFileUploaded={() => {
            setMissionCompleted("1", true);
          }}
          taskReletedFiles={taskReletedFiles}
        />
      </div>

      <div
        style={{
          direction: "rtl",
          width: "5%",
          padding: 20,
          justifyContent: "end",
          display: "flex",
          position: "sticky",
          bottom: 0,
        }}
      >
        <BlackButton width="5vw" height="5vh" onclickProps={handleSaveFeedback}>
          {isSaving ? "שומר..." : "שמור נתונים"}
        </BlackButton>
      </div>
      {selectedEvent && (
        <UserTaskModal
          taskId={selectedEvent?.task_id || selectedEvent?.Task?.id}
          completed_at={selectedEvent?.completed_at}
          task={selectedEvent}
          openModal={openUserModal}
          setOpenModal={setOpenUserModal}
          onRefresh={() => setRefreshCount((c) => c + 1)}
          showFeedbackButton={false}
        />
      )}
    </div>
  );
};

export default FeedbackForm;
