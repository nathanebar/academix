import { useEffect, useRef, useState } from "react";
import style from "./CreateForms.module.css";
import { useFormStore } from "../../../store/formStore";
import RegularInput from "../../../UI/Input/Input/RegularInput";
import QuestionRenderer from "../QuestionRenderer/QuestionRenderer";
import {
  Button,
  ConfigProvider,
  Input,
  Modal,
  notification,
  Radio,
  Switch,
  Tooltip,
} from "antd";
import {
  ApartmentOutlined,
  CaretLeftFilled,
  FileTextOutlined,
  InfoCircleOutlined,
  LockOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { createForm, updateeForm } from "../../../services/ApiServices";
import { useUserStore } from "../../../store/userStore";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TextArea from "antd/es/input/TextArea";
import { QuestionType } from "../../../types/types";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useFetchFormsByFormId } from "../../../hooks/Forms/useFetchFormByFormId";
import { queryClient } from "../../../api/queryClient";
import { usePermissionStore } from "../../../store/permissionStore";
import {
  saveDraft,
  loadDraft,
  clearDraft,
} from "../../../utils/formDraftStorage";
import { uploadFilesToS3, deleteFiles } from "../../../store/taskStore";
const CreateForms = () => {
  const { title, setTitle, description, setDescription, setQuestions } =
    useFormStore();
  const { user } = useUserStore();
  const navigate = useNavigate();

  /* ---------- state ---------- */
  const [examAccessibility, setExamAccessibility] = useState<"team" | "course">(
    "team"
  );
  const [originalQuestionsForEdit, setOriginalQuestionsForEdit] =
    useState<any>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showScore, setShowScore] = useState<boolean>(false);
  const [maxGrade, setMaxGrade] = useState<number>(0);
  const [autoGradePerQuestion, setAutoGradePerQuestion] =
    useState<boolean>(false);

  /* ---------- refs ---------- */
  const originalTitle = useRef<string>("");
  const originalDescription = useRef<string>("");
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restorePromptShown = useRef<boolean>(false); // anti double modal (StrictMode)
  const restoreDone = useRef<boolean>(false); // gate : ne pas sauvegarder avant la fin de la restauration

  /* ---------- route ---------- */
  const location = useLocation();
  const isSurveyPage = location.pathname.includes("/survey");
  const { formId } = useParams<{ formId: string }>();
  const isEdit =
    (location.pathname?.includes("forms/edit") ||
      location.pathname?.includes("survey/edit")) &&
    !!formId;

  const labels = {
    single: isSurveyPage ? "סקר" : "מבחן",
    plural: isSurveyPage ? "סקרים" : "מבחנים",
    failedCreate: isSurveyPage ? "נכשלה יצירת הסקר" : "נכשלה יצירת המבחן",
    failedUpdate: isSurveyPage ? "נכשל עדכון הסקר" : "נכשל עדכון המבחן",
    placeholder: isSurveyPage ? "שם הסקר" : "שם המבחן",
    descriptionPlaceholder: isSurveyPage ? "תיאור הסקר" : "תיאור המבחן",
  };

  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );

  const isAdmin =
    selectedPermission?.role_code == "SYSTEM-ADMIN" ||
    selectedPermission?.role_code === "DOMAIN_MANAGER" ||
    selectedPermission?.role_code === "COURSE_COMMANDER";

  /* ---------- question vide par défaut ---------- */
  const createEmptyQuestion = (): QuestionType => ({
    text: "",
    required: false,
    points: 0,
    type: "text",
    options: ["", "", ""],
    fields: [
      { id: 2, text: "התחלה", type: "not-changeable" },
      { id: 3, text: "הזן את המילה חסרה", type: "changeable" },
      { id: 4, text: "סוף", type: "not-changeable" },
    ],
    correctedOptions: Array(4).fill(true),
    matches: [{ value1: "", value2: "" }],
    max: { value: 0, title: "" },
    min: { value: 0, title: "" },
  });

  const [questionsForEdit, setQuestionsForEdit] = useState<{
    questions: QuestionType[];
  }>({ questions: [createEmptyQuestion()] });

  const { selectedCourse, selectedTeam } = useSelectionsStore();
  const [showEditButton, setShowEditButton] = useState<boolean>(false);
  const { data: formFromDB } = useFetchFormsByFormId(
    isEdit ? Number(formId) : undefined
  );

  /* =====================================================================
     Conversion DB -> état local
     ===================================================================== */
  const convertQuestionsFromDBtoLocalState = (dataFromDB: any[]) => {
    const toPairs = (items: any[], opp: boolean) => {
      const pairs = [];
      let pendingLeft: string | null = null;
      for (const it of items) {
        if (opp) {
          if (it.side === "right") {
            pendingLeft = it.option_text;
          } else {
            const left = pendingLeft ?? "";
            pairs.push({ value1: left, value2: it.option_text });
            pendingLeft = null;
          }
        } else {
          if (it.side === "left") {
            pendingLeft = it.option_text;
          } else {
            const left = pendingLeft ?? "";
            pairs.push({ value1: left, value2: it.option_text });
            pendingLeft = null;
          }
        }
      }
      return pairs;
    };

    const questionsForLocalState: QuestionType[] = [];
    dataFromDB?.forEach((questionFromDB) => {
      switch (questionFromDB?.question_type) {
        case "text":
        case "true_false":
        case "description":
        case "fill_in_open":
          questionsForLocalState.push({
            id: questionFromDB?.id,
            type: questionFromDB?.question_type,
            text: questionFromDB?.question_text,
            points: questionFromDB?.points,
            required: questionFromDB?.is_required,
          });
          break;

        case "fill_in_bank":
          questionsForLocalState.push({
            id: questionFromDB?.id,
            type: questionFromDB?.question_type,
            text: questionFromDB?.question_text,
            points: questionFromDB?.points,
            required: questionFromDB?.is_required,
            fields: questionFromDB?.question_text?.trim().split(/\s+/),
            matches: (questionFromDB?.FormOptions || []).map((o: any) => ({
              value1: o.option_text,
              value2: "",
            })),
          });
          break;

        case "scale":
          console.log(questionFromDB);
          questionsForLocalState.push({
            id: questionFromDB?.id,
            type: questionFromDB?.question_type,
            text: questionFromDB?.question_text,
            points: questionFromDB?.points,
            required: questionFromDB?.is_required,
            min: {
              title: questionFromDB?.FormOptions?.reduce((a: any, b: any) =>
                b.orderIndex < a.orderIndex ? b : a
              )?.option_text,
              value: questionFromDB?.FormOptions?.reduce((a: any, b: any) =>
                b.orderIndex < a.orderIndex ? b : a
              )?.orderIndex,
            },
            max: {
              title: questionFromDB?.FormOptions?.reduce((a: any, b: any) =>
                b.orderIndex > a.orderIndex ? b : a
              )?.option_text,
              value: questionFromDB?.FormOptions?.reduce((a: any, b: any) =>
                b.orderIndex > a.orderIndex ? b : a
              )?.orderIndex,
            },
          });
          break;

        case "american":
        case "ordering_line":
          questionsForLocalState.push({
            id: questionFromDB?.id,
            type: questionFromDB?.question_type,
            text: questionFromDB?.question_text,
            points: questionFromDB?.points,
            required: questionFromDB?.is_required,
            options: questionFromDB?.FormOptions?.map(
              (op: any) => op?.option_text
            ),
          });
          break;

        // ex-MatchPair : sous-questions (side=right) + pool partagé (side=left)
        case "multipleQuestion":
          questionsForLocalState.push({
            id: questionFromDB?.id,
            type: questionFromDB?.question_type,
            text: questionFromDB?.question_text || "",
            points: questionFromDB?.points,
            required: questionFromDB?.is_required,
            matches: (questionFromDB?.FormOptions || [])
              ?.filter((o: any) => o.side === "right")
              ?.sort(
                (a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
              )
              ?.map((o: any) => ({ value1: o.option_text, value2: "" })),
            options: (questionFromDB?.FormOptions || [])
              ?.filter((o: any) => o.side === "left")
              ?.sort(
                (a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
              )
              ?.map((o: any) => o.option_text),
          });
          break;

        // ex-MatrixSingle : paires mot ↔ pair
        case "matching_pairs":
        case "matrix_single": // compat anciennes données
          questionsForLocalState.push({
            id: questionFromDB?.id,
            type: questionFromDB?.question_type,
            text: questionFromDB?.question_text || "",
            points: questionFromDB?.points,
            required: questionFromDB?.is_required,
            matches: toPairs(questionFromDB?.FormOptions, true),
          });
          break;

        case "file_upload":
          questionsForLocalState.push({
            id: questionFromDB?.id,
            type: questionFromDB?.question_type,
            text: questionFromDB?.question_text,
            points: questionFromDB?.points,
            required: questionFromDB?.is_required,
            existingFiles:
              (questionFromDB?.files || questionFromDB?.Files)
                ?.filter(
                  (file: any) => file.isFileResponse === false && !file.task_id
                )
                ?.map((file: any) => ({
                  id: file.id,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  s3Key: file.s3Key,
                  s3BucketName: file.s3BucketName,
                  url: `${process.env.REACT_APP_API_BASE_URL}/files/${file.s3Key}`,
                })) || [],
          });
          break;

        default:
          break;
      }
    });
    return questionsForLocalState;
  };

  /* =====================================================================
     Chargement en mode édition
     ===================================================================== */
  useEffect(() => {
    if (formFromDB) {
      const data = formFromDB?.[0]?.data;
      setTitle(data?.title);
      setDescription(data?.description);
      setShowScore(data?.show_score_per_question);
      const questionsFromDB = convertQuestionsFromDBtoLocalState(
        data?.FormQuestions
      );
      setQuestionsForEdit({ questions: questionsFromDB });
      setOriginalQuestionsForEdit({ questions: questionsFromDB });
      originalTitle.current = data?.title ?? "";
      originalDescription.current = data?.description ?? "";
      restoreDone.current = true; // pas de brouillon à gérer en édition
    }
  }, [formFromDB]);

  /* ---------- accessibility (édition) ---------- */
  useEffect(() => {
    if (!isEdit) return;
    const teamId = formFromDB?.[0]?.data?.teamId;
    setExamAccessibility(teamId ? "team" : "course");
  }, [isEdit, formFromDB]);

  useEffect(() => {
    const isSpecialRole =
      selectedPermission?.role_code === "OVERLAP" ||
      selectedPermission?.role_code === "TEAM_COMMANDER" ||
      selectedPermission?.role_code === "STUDENT";
    const isSameTeam =
      String(selectedPermission?.scope_id) ===
      String(formFromDB?.[0]?.data?.teamId);
    setShowEditButton(!isSpecialRole || isSameTeam);
  }, [selectedPermission, formFromDB]);

  /* =====================================================================
     Brouillon (sessionStorage) — création uniquement
     ===================================================================== */
  /* ---------- restore ---------- */
  useEffect(() => {
    if (isEdit) {
      restoreDone.current = true;
      return;
    }
    if (restorePromptShown.current) return; // StrictMode : un seul prompt
    restorePromptShown.current = true;

    const draft = loadDraft(isSurveyPage);
    if (!draft) {
      restoreDone.current = true;
      return;
    }

    Modal.confirm({
      title: "נמצאה טיוטה שמורה",
      content: "האם ברצונך להמשיך לערוך מהטיוטה?",
      okText: "המשך מהטיוטה",
      cancelText: "התחל מהתחלה",
      style: { direction: "rtl" },
      onOk: () => {
        setTitle(draft.title ?? "");
        setDescription(draft.description ?? "");
        setShowScore(draft.showScore ?? false);
        setAutoGradePerQuestion(draft.autoGradePerQuestion ?? false);
        console.log(draft.maxGrade);
        setMaxGrade(draft.maxGrade ?? 0);
        setExamAccessibility(draft.examAccessibility ?? "team");
        setQuestionsForEdit(
          draft.questionsForEdit ?? { questions: [createEmptyQuestion()] }
        );
        restoreDone.current = true;
        notification.info({ message: "הטיוטה נטענה בהצלחה" });
      },
      onCancel: () => {
        clearDraft(isSurveyPage);
        restoreDone.current = true;
      },
    });
  }, [isEdit]);

  /* ---------- auto-save ---------- */
  useEffect(() => {
    if (isEdit || !restoreDone.current) return; // attend la fin de la restauration
    saveDraft(isSurveyPage, {
      title,
      description,
      showScore,
      maxGrade,
      autoGradePerQuestion,
      examAccessibility,
      questionsForEdit,
    });
  }, [
    isEdit,
    isSurveyPage,
    title,
    description,
    showScore,
    maxGrade,
    autoGradePerQuestion,
    examAccessibility,
    questionsForEdit,
  ]);

  /* =====================================================================
     Reset quand on n'est pas en édition
     ===================================================================== */
  useEffect(() => {
    if (!isEdit) {
      setTitle("");
      setDescription("");
      setQuestions([]);
      originalTitle.current = "";
      originalDescription.current = "";
      setOriginalQuestionsForEdit(null);
      setQuestionsForEdit({ questions: [createEmptyQuestion()] });
    }
  }, [isEdit]);

  /* ---------- hasChanges (titre + description + questions) ---------- */
  useEffect(() => {
    const hasQuestionsChanged =
      JSON.stringify(questionsForEdit) !==
      JSON.stringify(originalQuestionsForEdit);
    const hasMetaChanged =
      title !== originalTitle.current ||
      description !== originalDescription.current;
    setHasChanges(Boolean(hasQuestionsChanged || hasMetaChanged));
  }, [questionsForEdit, title, description]);

  /* ---------- nettoyage timer au démontage ---------- */
  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
    };
  }, []);

  /* ---------- bouton "back" ---------- */
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handleBackButton = () => {
      if (isEdit && hasChanges) {
        Modal.confirm({
          title: "יש שינויים שלא נשמרו",
          content: "האם אתה בטוח שברצונך לסגור?",
          okText: "סגור",
          cancelText: "ביטול",
          style: { direction: "rtl" },
          onOk: () => {
            setHasChanges(false);
            navigate(
              isSurveyPage ? "/survey/surveyDashboard" : "/forms/formDashboard"
            );
          },
          onCancel: () => {
            window.history.pushState(null, "", window.location.href);
          },
        });
        window.history.pushState(null, "", window.location.href);
      } else {
        navigate(
          isSurveyPage ? "/survey/surveyDashboard" : "/forms/formDashboard"
        );
      }
    };

    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [isEdit, hasChanges, isSurveyPage, navigate]);

  /* =====================================================================
     Sauvegarde
     ===================================================================== */
  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["surveyDashboard"] });
    queryClient.invalidateQueries({ queryKey: ["forms"] });
    navigateTimer.current = setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ["formByFormId"] });
      queryClient.refetchQueries({ queryKey: ["surveyDashboard"] });
      navigate(
        isSurveyPage ? "/survey/surveyDashboard" : "/forms/formDashboard"
      );
    }, 1000);
  };

  const getQuestionTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      text: "טקסט",
      scale: "סולם",
      fill_in_open: "השלמה פתוחה",
      american: "אמריקאי",
      multipleQuestion: "שאלות מרובות",
      matching_pairs: "זיווג",
      fill_in_bank: "מילוי מהבנק",
      ordering_line: "סידור שורה",
      ordering_words: "סידור מילים",
      true_false: "אמת/שקר",
      description: "תיאור",
      file_upload: "העלאת קובץ",
    };
    return typeLabels[type] || type;
  };

  const saveForm = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      /* ---------- VALIDATION ---------- */
      const validationErrors: string[] = [];
      for (const question of questionsForEdit.questions) {
        const needsText = ![
          "multipleQuestion",
          "ordering_line",
          "fill_in_open",
          "fill_in_bank",
          "file_upload",
          "matching_pairs",
        ].includes(question.type);

        if (needsText && question.text?.trim() === "") {
          validationErrors.push(
            `שאלה מסוג "${getQuestionTypeLabel(question.type)}" חסר טקסט`
          );
        }
        if (
          !isSurveyPage &&
          question.points === 0 &&
          question.type !== "description" &&
          question.type !== "file_upload"
        ) {
          validationErrors.push(
            `שאלה מסוג "${getQuestionTypeLabel(question.type)}" חסרות נקודות`
          );
        }

        /* --- validation fichiers --- */
        if (question.type === "file_upload" && question.required) {
          const hasFile =
            (question.uploadedFiles || []).some(
              (f: any) => f.file instanceof File
            ) ||
            (question.uploadedFiles || []).some((f: any) => f.s3Key || f.key);
          if (!hasFile) {
            validationErrors.push(
              `שאלת קובץ "${question.text || "ללא כותרת"}" חסר קובץ (שדה חובה)`
            );
          }
        }
      }
      if (title?.trim() === "") {
        validationErrors.push(`יש להזין כותרת ל${labels.single}`);
      }
      if (validationErrors.length > 0) {
        notification.error({
          message: "יש לתקן את השגיאות הבאות:",
          description: validationErrors.map((err, idx) => (
            <div key={idx} style={{ marginTop: 4 }}>
              • {err}
            </div>
          )),
          duration: 5,
        });
        return;
      }

      /* ============================================================
         ÉTAPE 1 — PRÉPARER LES FICHIERS (avant la sauvegarde)
         - fichier existant → on renvoie sa clé S3
         - nouveau fichier → upload multipart, on récupère la clé
         On n'envoie JAMAIS de File en JSON au backend.
         ============================================================ */
      const questionsPayload = await Promise.all(
        questionsForEdit.questions.map(async (q) => {
          if (q.type !== "file_upload") return q;

          const uploadedFiles: any[] = [];
          for (const f of q.uploadedFiles || []) {
            if (f.isExisting && (f.s3Key || f.key)) {
              // déjà sur S3 → ré-attache par sa clé
              uploadedFiles.push({
                key: f.s3Key || f.key,
                name: f.name,
                size: f.size,
                type: f.type,
                bucket: "academix",
              });
            } else if (f.file instanceof File) {
              // nouveau fichier → upload multipart maintenant
              const res = await uploadFilesToS3(
                [f.file],
                null,
                null,
                false,
                false
              );
              const key = res?.[0]?.data?.s3Key || res?.[0]?.data?.key;
              if (!key) throw new Error(`Upload échoué pour ${f.file.name}`);
              uploadedFiles.push({
                key,
                name: f.file.name,
                size: f.file.size,
                type: f.file.type,
                bucket: "academix",
              });
            }
          }
          return { ...q, uploadedFiles };
        })
      );

      /* ============================================================
         ÉTAPE 2 — SAUVEGARDE (create ou update)
         ============================================================ */
      const formPayload: {
        creator: number;
        courseId: any;
        show_score_per_question: boolean;
        description: string;
        title: string;
        type: "test" | "survey";
        is_active: boolean;
      } = {
        creator: user?.id || -1,
        courseId: selectedCourse?.id,
        show_score_per_question: showScore,
        description,
        title,
        type: !isSurveyPage ? "test" : "survey",
        is_active: true,
      };

      if (isEdit) {
        const res = await updateeForm(
          formPayload,
          questionsPayload,
          Number(formId)
        );
        if (!res || res.error) throw "server error";
        setQuestions(questionsPayload as any);
        notification.success({ message: `ה${labels.single} עודכן` });
      } else {
        const res = await createForm(
          {
            ...formPayload,
            teamId: examAccessibility === "team" ? selectedTeam?.id : null,
          },
          questionsPayload
        );
        if (!res || res.error) throw "server error";
        clearDraft(isSurveyPage);
        setQuestions(questionsPayload as any);
        notification.success({ message: `ה${labels.single} נוצר` });
      }

      handleSaveSuccess();
    } catch (err) {
      notification.error({
        message: isEdit ? labels.failedUpdate : labels.failedCreate,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- autoGrade ---------- */
  useEffect(() => {
    if (!autoGradePerQuestion) return;
    setQuestionsForEdit((prev) => {
      const nonDesc = prev.questions.filter((q) => q.type !== "description");
      const count = nonDesc.length;
      if (count === 0) return prev;
      const base = Math.floor(maxGrade / count);
      const extra = maxGrade % count;
      let extraAssigned = 0;
      const updated = prev.questions.map((question) => {
        if (question.type === "description") return question;
        const addOne = extraAssigned < extra ? 1 : 0;
        extraAssigned++;
        return { ...question, points: base + addOne };
      });
      return { ...prev, questions: updated };
    });
  }, [maxGrade, questionsForEdit.questions.length, autoGradePerQuestion]);

  /* =====================================================================
     Rendu
     ===================================================================== */
  return (
    <ConfigProvider
      theme={{
        components: {
          Input: { colorTextPlaceholder: "rgba(94, 99, 102, 0.5)" },
        },
      }}
    >
      <div className={style["container"]}>
        {/* ---------- HEADER / TOOLBAR ---------- */}
        <div className={style["header"]}>
          {isAdmin && (
            <div
              className={style["accessibility-panel"]}
              style={{ direction: "rtl" }}
            >
              <Tooltip
                title={`בחר האם תבנית ה${labels.single} תהיה נגישה לכל הצוותים שבקורס או רק לצוות הנבחר`}
                placement="bottom"
              >
                <InfoCircleOutlined
                  style={{
                    fontSize: "1.1rem",
                    color: "#c77f00",
                    cursor: "pointer",
                  }}
                />
              </Tooltip>
              <span className={style["radio-label"]}>
                נגישות ה{labels.single}:
              </span>
              <Radio.Group
                value={examAccessibility}
                onChange={(e) => setExamAccessibility(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="team">
                  <TeamOutlined /> צוות ספציפי ({selectedTeam?.name})
                </Radio.Button>
                <Radio.Button value="course">
                  <ApartmentOutlined /> כל הצוותים בקורס
                </Radio.Button>
              </Radio.Group>
            </div>
          )}

          {!isSurveyPage && (
            <div className={style["toolbar"]}>
              <div className={style["toolbar-group"]}>
                <div className={style["switch-affix-container"]}>
                  <Switch
                    checked={autoGradePerQuestion}
                    onChange={setAutoGradePerQuestion}
                    size="default"
                    style={{
                      background: autoGradePerQuestion ? "#c77f00" : "#d4dade",
                    }}
                  />
                  <div>ציון אוטומטי לשאלה</div>
                  <Tooltip title="ביצוע ציון אוטומטי יחלק על סך הנקודות המקסימלי שבחרת באופן שווה בין השאלות שהוגדרו במבחן   לדוגמה: אם הוגדר ציון מקסימלי של 100 נקודות  קיימות 8 שאלות כל שאלה תקבל ניקוד מקסימלי של 12.5 נקודות">
                    <QuestionCircleOutlined style={{ color: "#a3a6a8" }} />
                  </Tooltip>
                </div>

                {autoGradePerQuestion && (
                  <Input
                    type="number"
                    placeholder="ציון מקסימלי"
                    defaultValue={maxGrade}
                    onChange={({ target }) => {
                      const value = parseInt(target.value);
                      setMaxGrade(value > -1 ? value : 0);
                    }}
                    className={style["grade"]}
                  />
                )}
              </div>

              <div className={style["toolbar-group"]}>
                <div className={style["switch-affix-container"]}>
                  <Switch
                    checked={showScore}
                    onChange={setShowScore}
                    size="default"
                    style={{ background: showScore ? "#2b6fe0" : "#d4dade" }}
                  />
                  <div>הצג לנבחן את ציון השאלה</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------- HERO CARD : titre + description ---------- */}
        <div className={style["editor-shell"]}>
          <div className={style["create-form"]}>
            <div className={style["header-container"]}>
              <h2>
                {isEdit
                  ? `עריכת ${labels.single} קיים`
                  : `יצירת ${labels.single} חדש`}
              </h2>
              <span className={style["form-badge"]}>
                <FileTextOutlined style={{ marginLeft: 6 }} />
                {labels.single}
              </span>
            </div>

            <div className={style["input-container"]}>
              <RegularInput
                width="100%"
                borderRadius="12px"
                height="48px"
                placeholder={labels.placeholder}
                value={title}
                setValue={setTitle}
              />
            </div>
            <div className={style["input-container"]} style={{ marginTop: 14 }}>
              <TextArea
                className={style["TextArea"]}
                placeholder={labels.descriptionPlaceholder}
                value={description}
                onChange={({ target }) => setDescription(target.value)}
              />
            </div>
          </div>

          {/* ---------- QUESTIONS ---------- */}
          <div className={style["questions-zone"]}>
            <QuestionRenderer
              setQuestionsForEdit={setQuestionsForEdit}
              questionsForEdit={questionsForEdit}
              autoGrade={autoGradePerQuestion}
              isSurveyPage={isSurveyPage}
            />
          </div>

          {/* ---------- SCORE BANNER ---------- */}
          {!isSurveyPage && (
            <div className={style["score-banner"]}>
              הציון המקסימלי ל{labels.single} הוא{" "}
              <span className={style["score-value"]}>
                {autoGradePerQuestion
                  ? maxGrade
                  : questionsForEdit.questions.reduce(
                      (sum, item) => sum + (item.points || 0),
                      0
                    )}
              </span>
            </div>
          )}
        </div>

        {/* ---------- ACTION FLOATING BAR ---------- */}
        <div className={style["btnDiv"]}>
          {!isEdit ? (
            <Button
              className={style["submit-button"]}
              onClick={saveForm}
              disabled={isSaving}
            >
              <CaretLeftFilled style={{ fontSize: "1.4rem" }} />
              שמור
            </Button>
          ) : isEdit && showEditButton ? (
            <Button
              className={style["submit-button"]}
              onClick={saveForm}
              disabled={isSaving}
            >
              <CaretLeftFilled style={{ fontSize: "1.4rem" }} />
              עדכן
            </Button>
          ) : (
            <div className={style["cannot-edit"]}>
              <LockOutlined />
              <span>אין הרשאת עריכה</span>
            </div>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default CreateForms;
