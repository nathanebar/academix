import { useEffect, useRef, useState } from "react";
import style from "./FormBody.module.css";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useFetchFormByTaskAssignmentId } from "../../../hooks/Forms/useFetchFormById";
import { QuestionsTypes } from "../../../types/types";
import TextQuestion from "../QuestionsComponents/TextQuestion/TextQuestion";
import AmericanQuestion from "../QuestionsComponents/AmericanQuestion/AmericanQuestion";
import Note from "../QuestionsComponents/Note/Note";
import Fill_in_bank from "../QuestionsComponents/Fill_In_BankQuestion/Fill_In_BankQuestion";
import Fill_in_open from "../QuestionsComponents/Fill_in_OpenQuestion/Fill_in_OpenQuestion";
import True_False from "../QuestionsComponents/True_FalseQuestion/True_FalseQuestion";
import Scale from "../QuestionsComponents/ScaleQuestion/ScaleQuestion";
import BlackButton from "../../../UI/Button/BlackButton";
import {
  createFormSubmission,
  createFormSubmissionsAnswer,
  getTasksByUser,
  putFormSubmission,
  putFormSubmissionsAnswer,
} from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import {
  CalendarOutlined,
  CaretLeftOutlined,
  RightOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Matrix_single from "../QuestionsComponents/Matrix_single/Matrix_single";
import Ordering_line from "../QuestionsComponents/Ordering_line/Ordering_line";
import Ordering_words from "../QuestionsComponents/Ordering_words/Ordering_words";
import { Button, Modal, notification } from "antd";
import { queryClient } from "../../../api/queryClient";
import { useSelectionsStore } from "../../../store/selectionStore";
import FileQuestion from "../QuestionsComponents/FileQuestion/FileQuestion";
import { UserTaskModal } from "../../../components/LazyTaskModals";
import dayjs from "dayjs";
import { usePermissionStore } from "../../../store/permissionStore";
import MatchingPairs from "../QuestionsComponents/Matrix_single/Matrix_single";
import MultipleQuestions from "../QuestionsComponents/MultipleQuestions/MultipleQuestions";
import {
  saveAnswerDraft,
  loadAnswerDraft,
  clearAnswerDraft,
} from "../../../utils/answerDraftStorage";

interface FormBodyProps {
  renderFor: "show" | "answer" | "grading";
  tI?: number;
}

const FormBody = (props: FormBodyProps) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { taskAssignmentId: taFromParams } = useParams<{
    taskAssignmentId: string;
  }>();
  const { selectedTeamMember, selectedTeam, selectedCourseBatch } =
    useSelectionsStore();
  const { selectedPermission } = usePermissionStore();
  const [form, setForm] = useState<any>();
  const [formData, setFormData] = useState<any>([]);
  const [missionData, setMissionData] = useState<any>();
  const [openUserModal, setOpenUserModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  /* ---------- brouillon réponse ---------- */
  const restorePromptShown = useRef<boolean>(false);
  // ✅ gate RÉACTIF (state) : l'auto-save se relance quand il passe à true
  const [restoreDone, setRestoreDone] = useState<boolean>(false);

  const isSurvey = searchParams.get("isSurvey") === "true";
  const taskAssignmentId =
    props.renderFor === "grading" ? props?.tI : Number(taFromParams);
  const started_at = new Date();

  const fetchedForm = useFetchFormByTaskAssignmentId(
    Number(taskAssignmentId),
    props.renderFor,
    isSurvey
  );

  const formError = fetchedForm?.data?.error;
  const axiosError = fetchedForm?.error as any;
  const serverError =
    axiosError?.response?.data?.error ||
    axiosError?.response?.data?.message ||
    fetchedForm?.data?.error;

  const isSurveyAlreadyAnswered = serverError === "כבר ענית על סקר זה";
  const isSurveyNotAnswered = serverError === "המשתמש טרם ענה על הסקר";

  const hasSubmission =
    form?.formSubmission?.length > 0 ||
    fetchedForm?.data?.formSubmission?.length > 0;

  const hasData = form?.form?.length > 0 || fetchedForm?.data?.form?.length > 0;

  const isLoading = fetchedForm?.isLoading || fetchedForm?.isFetching;
  const isError = fetchedForm?.isError;

  useEffect(() => {
    if (fetchedForm?.data) {
      setForm(fetchedForm?.data);
    }
  }, [JSON.stringify(fetchedForm?.data), taskAssignmentId]);

  /* ✅ redirection survey déjà répondu (fusionné, hors du if) */
  useEffect(() => {
    if (isSurvey && isSurveyAlreadyAnswered && isLoading) {
      navigate(`/forms/show/${taskAssignmentId}?isSurvey=true`, {
        replace: true,
      });
      return;
    }
    if (isSurvey && props.renderFor === "answer") {
      if (isSurveyAlreadyAnswered || hasSubmission) {
        navigate(`/forms/show/${taskAssignmentId}?isSurvey=true`, {
          replace: true,
        });
      }
    }
  }, [
    isSurvey,
    props.renderFor,
    isSurveyAlreadyAnswered,
    hasSubmission,
    isLoading,
    taskAssignmentId,
    navigate,
  ]);

  /* ------------------------------------------------------------------
     Restauration du brouillon (mode réponse)
     - attend hasData (formulaire chargé)
     - anti double prompt (restorePromptShown)
     - setRestoreDone(true) dans TOUS les cas (même sans brouillon)
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (props.renderFor !== "answer") return;
    if (!taskAssignmentId) return;

    // attendre le chargement des questions
    if (!hasData) return;

    if (restorePromptShown.current) return;
    restorePromptShown.current = true;

    const draft = loadAnswerDraft(Number(taskAssignmentId));

    // ✅ pas de brouillon → on active la sauvegarde immédiatement
    if (!draft) {
      setRestoreDone(true);
      return;
    }

    Modal.confirm({
      title: "נמצאה טיוטה שמורה",
      content: "האם ברצונך להמשיך מהמקום שעצרת?",
      okText: "המשך מהטיוטה",
      cancelText: "התחל מההתחלה",
      style: { direction: "rtl" },
      onOk: () => {
        console.log(draft);
        setFormData(draft.formData ?? []);
        setRestoreDone(true); // ✅ remet l'auto-save en route
        notification.info({ message: "הטיוטה נטענה בהצלחה" });
      },
      onCancel: () => {
        clearAnswerDraft(Number(taskAssignmentId));
        setFormData([]);
        setRestoreDone(true); // ✅ on repart de zéro et on sauvegarde
      },
    });
  }, [props.renderFor, taskAssignmentId, hasData]);

  /* ------------------------------------------------------------------
     Auto-save : réactif car restoreDone est un STATE
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (props.renderFor !== "answer") return;
    if (!taskAssignmentId) return;
    if (!restoreDone) return;

    saveAnswerDraft(Number(taskAssignmentId), { formData });
  }, [props.renderFor, taskAssignmentId, formData, restoreDone]);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedTeamMember?.id) {
        const skipVisibility = selectedPermission?.role_code !== "STUDENT";
        const data = await getTasksByUser(
          selectedTeamMember?.user_id
            ? Number(selectedTeamMember?.user_id)
            : Number(selectedTeamMember?.id),
          selectedTeam?.id ? Number(selectedTeam?.id) : null,
          selectedPermission?.role_code,
          selectedCourseBatch?.id,
          skipVisibility
        );
        setMissionData(data);

        if (selectedEvent?.id) {
          const updatedTask = data.find((t: any) => t.id === selectedEvent.id);
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
  }, [
    selectedTeamMember,
    selectedPermission?.role_code,
    refreshCount,
    selectedEvent,
    selectedTeam,
    selectedCourseBatch,
  ]);

  interface FlatTask {
    id: number;
    name: string;
    gn: string;
    color: string;
    status: string;
    creatorName: string;
    creatorUsername: string;
    taskId: number;
    task_id?: any;
    most_frequent_assigned_at_start: string;
    most_frequent_assigned_at_end: string;
    source?: string;
    completed: string | null;
    completed_at: string | null;
    taskassignmentid: number;
  }

  const transformMission = (m: any): any => {
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
  };

  const validateFileUploads = (): boolean => {
    const fileQuestions = form?.form?.[0]?.data?.FormQuestions?.filter(
      (q: any) => q?.question_type === "file_upload"
    );

    if (!fileQuestions || fileQuestions.length === 0) {
      return true;
    }

    for (const question of fileQuestions) {
      const answer = formData?.find(
        (item: any) => item.form_question_id === question.id && item.value_text
      );

      if (!answer) {
        notification.error({
          message: `יש להעלות קובץ לשאלה`,
        });
        return false;
      }
    }

    return true;
  };

  const validateForm = (): boolean => {
    if (!formData || Object.keys(formData).length === 0) {
      notification.error({ message: "לא נשלחו תשובות על הטופס" });
      return false;
    }
    if (!form?.form?.[0]?.data?.id) {
      notification.error({ message: "לא נמצא מזהה הטופס" });
      return false;
    }
    if (!taskAssignmentId) {
      notification.error({ message: "לא נמצא מזהה המשימה" });
      return false;
    }
    if (!validateFileUploads()) {
      return false;
    }
    return true;
  };

  const saveForm = async () => {
    if (!validateForm()) return;

    Modal.confirm({
      title: "האם אתה בטוח שברצונך לשלוח את הטופס?",
      content: "לא ניתן לערוך את הטופס לאחר ההגשה.",
      okText: "כן, שלח",
      cancelText: "לא",
      onOk: async () => {
        try {
          const payload = {
            task_assignment_id: taskAssignmentId,
            form_id: form?.form?.[0]?.data?.id,
            started_at: started_at,
            submitted_at: new Date(),
            status: "submitted",
            answers: formData,
          };

          const res = await createFormSubmission(payload);

          if (res?.status === 201) {
            notification.success({ message: "הטופס נשלח בהצלחה" });
            // ✅ efface le brouillon après soumission
            clearAnswerDraft(Number(taskAssignmentId));
            await queryClient.invalidateQueries({ queryKey: ["form"] });

            if (isSurvey) {
              navigate(`/forms/show/${taskAssignmentId}?isSurvey=true`);
            } else {
              navigate(`/forms/formDashboard`);
            }
          } else {
            notification.error({
              message: "שגיאה בשליחת הטופס",
              description: res?.data?.message || "הבקשה נכשלה",
            });
          }
        } catch (err: any) {
          console.error("saveForm error:", err);
          notification.error({
            message: "שגיאת שרת",
            description: err?.message || "התרחשה תקלה בלתי צפויה",
          });
        }
      },
    });
  };

  const updateForm = async () => {
    if (!formData) return;

    const data = {
      score: formData.reduce(
        (sum: any, item: any) => sum + item.pointEarned,
        0
      ),
    };

    try {
      await putFormSubmission(data, form?.formSubmission[0]?.data?.id);

      const promises = formData.map((answer: any) =>
        putFormSubmissionsAnswer(answer, form?.formSubmission[0]?.data?.id)
      );

      const responses = await Promise.all(promises);

      const allSuccessful = responses.every(
        (response) => response.status === 200 || response.status === 201
      );

      if (allSuccessful) {
        Notification({ type: "success", msg: "שמירת המבחן בוצעה בהצלחה" });
        navigate(`/forms/formDashboard`);
      } else {
        Notification({ type: "error", msg: "מבחן זה נעשה כבר!" });
      }

      queryClient.refetchQueries({ queryKey: ["form"] });
      queryClient.refetchQueries({ queryKey: ["UsersInTeamAndTask"] });
    } catch (error) {
      Notification({ type: "error", msg: "שמירת המבחן נכשלה" });
    }
  };

  const QUESTION_COMPONENTS: Partial<
    Record<QuestionsTypes, React.ComponentType<any>>
  > = {
    text: TextQuestion,
    american: AmericanQuestion,
    description: Note,
    fill_in_bank: Fill_in_bank,
    fill_in_open: Fill_in_open,
    true_false: True_False,
    scale: Scale,
    matching_pairs: MatchingPairs,
    multipleQuestion: MultipleQuestions,
    ordering_line: Ordering_line,
    ordering_words: Ordering_words,
    file_upload: FileQuestion,
  };

  const renderQuestionComponent = (
    question: {
      FormOptions: any;
      question_type: QuestionsTypes;
      id: number;
      question_text: string;
      is_required: boolean;
      points: number | undefined | null;
    },
    options?: any,
    submission?: any,
    currentForm?: any
  ) => {
    const Component = QUESTION_COMPONENTS[question.question_type];
    if (!Component) {
      console.warn(
        `No component found for question type: ${question.question_type}`
      );
      return null;
    }

    const questionFiles =
      question.question_type === "file_upload"
        ? currentForm?.form?.[0]?.data?.FormQuestions?.find(
            (q: any) => q?.id === question?.id
          )?.files || []
        : undefined;

    return (
      <Component
        key={question?.id}
        questionId={question.id}
        question={question.question_text}
        required={question.is_required}
        points={question.points}
        renderFor={props.renderFor}
        formSubmissionId={currentForm?.formSubmission?.[0]?.data?.id}
        options={options || []}
        submission={submission || []}
        formData={formData}
        setFormData={setFormData}
        files={questionFiles}
      />
    );
  };

  const grade =
    props.renderFor === "show"
      ? form?.formSubmission?.[0]?.data?.score
      : "grading..";

  // ============================================
  // ✅ Early returns (tous les hooks sont DÉJÀ déclarés en haut)
  // ============================================

  if (isSurvey && isSurveyAlreadyAnswered && isLoading) {
    return (
      <div className={style["wrapper"]} style={{ marginTop: "2vh" }}>
        <div style={{ textAlign: "center", padding: "50px", fontSize: "24px" }}>
          <div>מעביר לתצוגת הסקר...</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={style["wrapper"]} style={{ marginTop: "2vh" }}>
        <div style={{ textAlign: "center", padding: "50px", fontSize: "24px" }}>
          <div>טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (isError && !isSurveyAlreadyAnswered && !isSurveyNotAnswered) {
    return (
      <div className={style["wrapper"]} style={{ marginTop: "2vh" }}>
        <div>אירעה שגיאה בטעינת הטופס: {serverError || "שגיאה לא ידועה"}</div>
      </div>
    );
  }

  if (
    !hasData &&
    (props.renderFor === "show" || props.renderFor === "grading")
  ) {
    return (
      <div className={style["wrapper"]} style={{ marginTop: "2vh" }}>
        {isSurvey && isSurveyNotAnswered ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              fontSize: "24px",
              color: "#f59e0b",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚠️</div>
            <div>המשתמש טרם ענה על הסקר</div>
            <div style={{ marginTop: "20px" }}>
              <BlackButton
                onclickProps={() => navigate(-1)}
                height="50px"
                width="150px"
                fontSize="18px"
              >
                חזור
              </BlackButton>
            </div>
          </div>
        ) : (
          <div>NO DATA!</div>
        )}
      </div>
    );
  }

  // ============================================
  // ✅ JSX Return
  // ============================================
  console.log(form?.form?.[0]?.data?.FormQuestions);
  return (
    <>
      <div className={style["wrapper"]}>
        {/* Header */}
        <div className={style["header_new"]}>
          <div className={style["header_right"]}>
            <div className={style["form_info"]}>
              <h1 className={style["form_title"]}>
                {form?.form?.[0]?.data?.title}
              </h1>
              {form?.form?.[0]?.data?.description && (
                <span className={style["form_description"]}>
                  {form?.form?.[0]?.data?.description}
                </span>
              )}
            </div>
          </div>

          {props?.renderFor === "grading" && (
            <Button
              className={style.missionButton}
              onClick={() => {
                const currentMission = missionData?.find(
                  (m: any) =>
                    m.task_id === form?.taskAssignment[0]?.data?.task_id
                );
                const transformed = transformMission(currentMission || null);
                setSelectedEvent(transformed);
                setOpenUserModal(true);
              }}
            >
              ראה תצוגת התרגיל
            </Button>
          )}

          <div className={style["header_left"]}>
            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={() => {
                if (isSurvey) {
                  if (selectedPermission?.role_code !== "STUDENT")
                    navigate("/survey/surveyDashboard");
                  else {
                    navigate("/");
                  }
                } else {
                  navigate("/forms/formDashboard");
                }
              }}
              className={style["back_button"]}
            />

            {/* 🏷️ Badge "טיוטה" */}
            {props.renderFor === "answer" && formData?.length > 0 && (
              <div
                className={style.draftBadge}
                title="התשובות נשמרות אוטומטית כטיוטה"
              >
                <span className={style.draftDot} />
                טיוטה נשמרה
              </div>
            )}

            <div className={style["member_tag"]}>
              <UserOutlined className={style["member_icon"]} />
              <span>
                {selectedTeamMember?.name || selectedTeamMember?.User?.name}
              </span>
            </div>

            {props.renderFor === "show" && !isSurvey && (
              <div className={style["grade_badge"]}>
                <span className={style["grade_label"]}>ציון</span>
                <span className={style["grade_value"]}>
                  {grade !== "grading.." ? grade : "—"}
                </span>
              </div>
            )}

            <div className={style["date_badge"]}>
              <CalendarOutlined className={style["date_icon"]} />
              <span className={style["date_text"]}>
                {form?.form?.[0]?.data?.createdAt && (
                  <>
                    {String(
                      new Date(form?.form?.[0].data?.createdAt).getDate()
                    ).padStart(2, "0")}
                    .
                    {String(
                      new Date(form?.form?.[0].data?.createdAt).getMonth() + 1
                    ).padStart(2, "0")}
                    .{new Date(form?.form?.[0].data?.createdAt).getFullYear()}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className={style["questions_container"]}>
          {form &&
            form?.form?.[0]?.data?.FormQuestions &&
            form?.form?.[0]?.data?.FormQuestions?.length > 0 &&
            form?.form?.[0]?.data?.FormQuestions?.sort(
              (a: any, b: any) => a?.orderIndex - b?.orderIndex
            )?.map((question: any) =>
              renderQuestionComponent(
                question,
                form?.form[0]?.data?.FormQuestions?.filter(
                  (q: any) => q?.id === question?.id
                )[0]?.FormOptions,
                form?.formSubmission?.[0]?.data?.FormSubmissionAnswers?.filter(
                  (fsa: any) => fsa?.form_question_id === question?.id
                ),
                form
              )
            )}
        </div>

        {/* Action Button */}
        {props.renderFor === "answer" && (
          <div style={{ marginTop: "1vh" }}>
            <BlackButton
              onclickProps={saveForm}
              height="50px"
              width="190px"
              fontSize="18px"
            >
              שמור
            </BlackButton>
          </div>
        )}

        {props.renderFor === "grading" && (
          <div style={{ marginTop: "1vh" }}>
            <BlackButton
              onclickProps={updateForm}
              height="50px"
              width="190px"
              fontSize="18px"
            >
              <CaretLeftOutlined style={{ marginTop: "0.25vh" }} />
              אשר ציון לנבחן
            </BlackButton>
          </div>
        )}
      </div>

      {/* User Task Modal */}
      {selectedEvent && (
        <UserTaskModal
          taskId={Number(selectedEvent?.extendedProps?.task_id)}
          completed_at={selectedEvent?.extendedProps?.completed_at}
          task={missionData?.find((t: any) => t.id === selectedEvent.id)}
          openModal={openUserModal}
          setOpenModal={setOpenUserModal}
          onRefresh={() => setRefreshCount((c) => c + 1)}
        />
      )}
    </>
  );
};

export default FormBody;
