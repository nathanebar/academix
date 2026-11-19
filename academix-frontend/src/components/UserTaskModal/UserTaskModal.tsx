import React, { useEffect, useMemo, useState } from "react";
import style from "./UserTaskModal.module.css";
import {
  Modal,
  Button,
  Tag,
  Tooltip,
  Spin,
  message,
  notification,
  Popconfirm,
  Switch,
} from "antd";
import {
  Task,
  updateFiles,
  uploadFilesToS3,
  useTaskStore,
} from "../../store/taskStore";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  FileJpgOutlined,
  FileTextOutlined,
  LoadingOutlined,
  SendOutlined,
  UndoOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ClockCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import twoIcon from "../../media/svg/solarlink-outline.svg";
import eightIcon from "../../media/svg/healthiconsi-exam-qualification-outline.svg";
import { useFetchFilesByTaskId } from "../../hooks/useFetchFilesByTaskId";
import { useTaskById } from "../../hooks/useGetTaskById";
import ReactPlayer from "react-player";
import CheckList from "../NewTaskModal/Inputs/CheckList/CheckList";
import UploadFiles from "../NewTaskModal/Inputs/UploadFiles/UploadFiles";
import { useSelectionsStore } from "../../store/selectionStore";
import { useNavigate } from "react-router-dom";
import {
  assignProgressCompleted,
  cancelTaskSubmission,
  markTaskAsCompleted,
  updateMissionCompleted,
  updateTaskAssignmentsCompleted,
} from "../../services/ApiServices";
import { useFetchCheckListsByTaskId } from "../../hooks/useFetchCheckListsByTaskId";
import WaveSurferComponent from "./Audio/WaveSurfer";
import { usePermissionStore } from "../../store/permissionStore";
import { useFetchTagsByTaskId } from "../../hooks/useFetchTagsByTaskId";
import Notification from "../../UI/Notification/Notification";
import NoteForStudent from "./NoteForStudent/NoteForStudent";
import { getFeedbackStatus } from "../../services/ApiServices";

export type UserTaskModalProps = {
  taskGroupName?: string;
  taskId?: number;
  taskAssignmentId?: number;
  task_assignment_id?: number;
  taskAssignment?: number;
  task?: Task | any;
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedEvent?: React.Dispatch<React.SetStateAction<any>>;
  completed_at?: any;
  onRefresh?: () => void;
  isPreview?: boolean;
  showFeedbackButton?: boolean;
  hasFeedback?: boolean;
};

type Mission = {
  id: number;
  progress_type: string;
  completed_at: Date | null;
};

const UserTaskModal = (props: UserTaskModalProps) => {
  // ═══════════════════════════════════════════════════════
  // הוספת סטייט לסוויץ' מבט חניך
  // ═══════════════════════════════════════════════════════
  const [viewAsStudent, setViewAsStudent] = useState(false);

  const [taskReletedFiles, setTaskReletedFiles] = useState<any[]>();
  const [patbassFile, setPatbassFile] = useState<any>();
  const [responseFiles, setResponseFiles] = useState<any[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<any[]>();
  const [isCompleted, setIsCompleted] = useState<boolean[]>([]);
  const [checkLists, setCheckList] = useState<any>([]);
  const taskInStore = useTaskStore((state) => state.task);
  const [completedAssMissions, setCompletedAssMissions] = useState<Mission[]>(
    [],
  );
  const checklistsData = useFetchCheckListsByTaskId(props.taskId);
  const { data: task, isLoading, isError } = useTaskById(props.taskId);
  const taskAssId =
    props.taskAssignmentId ??
    props.task?.task_assignment_id ??
    Number(props.task?.id);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState<number | null>(null);
  const [assignerName, setAssignerName] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<any>(null);

  const navigate = useNavigate();

  const handleFillFeedback = () => {
    const isQueue = props.task.assignments?.filter(
      (assigment: any) => assigment.id === props.task.task_assignment_id,
    )[0].isQueueTask;

    const taskAssignmentId =
      props.taskAssignmentId ||
      props.task?.task_assignment_id ||
      props.task?.extendedProps?.taskassignmentid;

    const taskId =
      props.task?.task_id ||
      props.task?.id ||
      props.task?.feedbackId ||
      props.task?.Task?.feedbackId ||
      props.taskId;

    if (!taskId || !taskAssignmentId) {
      message.error("לא ניתן לפתוח את המשוב - חסר מידע");
      return;
    }

    if (!selectedTeam?.id) {
      message.error("לא נבחר צוות");
      return;
    }

    const startDate =
      props.task?.assigned ||
      props.task?.start ||
      props.task.task_start ||
      props.task?.most_frequent_assigned_at_start;

    const endDate =
      props.task?.end_date ||
      props.task?.end ||
      props.task?.most_frequent_assigned_at_end;

    if (!startDate && !isQueue) {
      message.error("לא ניתן לפתוח את המשוב - חסר תאריך התחלה");
      return;
    }

    const dates = isQueue ? "" : `${startDate},${startDate},${startDate}`;
    const assignmentIds = String(taskAssignmentId);

    navigate(
      `/feedback/${taskId}/fill/${selectedTeam.id}?dates=${encodeURIComponent(
        dates,
      )}&assignmentIds=${assignmentIds}`,
    );
  };

  const handleViewFeedback = () => {
    const assignmentId =
      props.taskAssignmentId ||
      props.task?.task_assignment_id ||
      props.task?.extendedProps?.taskassignmentid ||
      taskAssId;

    if (!assignmentId) {
      message.error("לא ניתן לפתוח את המשוב - חסר מידע");
      return;
    }

    navigate(`/feedback/${assignmentId}/view`, {
      state: props.task?.assignedByName || task?.assignerName || undefined,
    });
  };

  const data = useFetchFilesByTaskId(props?.taskId, taskAssId);
  const selectedPermission = usePermissionStore(
    (s) => s.selectedPermission?.role_code,
  );

  const isSubmitted = useMemo(() => {
    return !!props.completed_at;
  }, [props.completed_at]);
  const effectivePermission = viewAsStudent ? "STUDENT" : selectedPermission;

  const shouldBlockForStudent =
    isSubmitted && effectivePermission === "STUDENT";

  const { selectedTeam } = useSelectionsStore();

  const tagsData = useFetchTagsByTaskId(props?.taskId);

  useEffect(() => {
    if (props.isPreview) return;
    fetchAssProgress();
  }, [checklistsData.data]);

  useEffect(() => {
    if (!taskAssId) return;
    getFeedbackStatus(taskAssId).then((res) => {
      if (res?.success) setFeedbackStatus(res.data?.data);
    });
  }, [taskAssId]);

  useEffect(() => {
    if (props.isPreview) return;
  
    
    if (data?.data) {
      setTaskReletedFiles(
        data?.data?.filter((file: any) => {
          return !file.isPatbass && !file.isFileResponse &&
      file?.feedback_answer_id == null;
        })
      );
      const patbassFiles = data?.data?.filter(
        (file: any) => file?.isPatbass && !file.isFileResponse,
      );

      setPatbassFile(patbassFiles);
      // ═══════════════════════════════════════════════════════
      // עדכון: שימוש ב-effectivePermission במקום selectedPermission
      // ═══════════════════════════════════════════════════════
      if (effectivePermission !== "STUDENT") {
        const files = data.data.filter(
          (f: any) => f.isFileResponse && f.task_assignment_id === taskAssId,
        );
        setResponseFiles(files);
      }

      const filesUpload = data.data.filter(
        (f: any) => f.isFileResponse && f.task_assignment_id === taskAssId,
      );
      setFilesToUpload(filesUpload);
    }
  }, [data?.data, props.isPreview]);

  useEffect(() => {
    setIsCompleted(
      completedAssMissions.map((mission) => {
        return mission.completed_at
          ? new Date(mission.completed_at)?.getTime() < new Date().getTime()
          : false;
      }),
    );
  }, [completedAssMissions]);

  useEffect(() => {
    if (isCompleted.length > 0 && isCompleted.every(Boolean)) {
      updateTaskAssignmentsCompleted(taskAssId);
    }
  }, [isCompleted]);

  useEffect(() => {
    if (props.task?.assignedByName) {
      setAssignerName(props.task.assignedByName);
    } else if (task?.assignerName) {
      setAssignerName(task.assignerName);
    }
  }, [props.task?.assignedByName, task?.assignerName]);

  const handleSubmitTask = async (taskAssignmetId: number) => {
    try {
      setIsSubmitting(taskAssignmetId);

      // ═══════════════════════════════════════════════════════
      // הוספת await ובדיקת התשובה
      // ═══════════════════════════════════════════════════════
      const result = await markTaskAsCompleted(taskAssignmetId);

      if (result?.success === false) {
        message.error(result?.message || "אירעה שגיאה בהגשת המשימה");
        return;
      }

      message.success("המשימה הוגשה בהצלחה");

      // סגירת המודל אחרי ההגשה המוצלחת
      handleClose();

      // רענון הנתונים
      props.onRefresh?.();
    } catch (error) {
      console.error("שגיאה בהגשת המשימה:", error);
      message.error("אירעה שגיאה בהגשת המשימה");
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleClose: () => void = () => {
    props.setOpenModal(false);
    // if (props.setSelectedEvent) props.setSelectedEvent(null);
  };

  const fetchAssProgress = async () => {
    try {
      const { data } = await assignProgressCompleted(Number(taskAssId));

      if (checklistsData.data?.length > 0 && data && !data.error) {
        const nonChecklistMissions = data.filter(
          (d: any) => d.progress_type && d.progress_type !== "checklist",
        );
        setCompletedAssMissions(data);
        const checklistProgress = data?.filter(
          (d: any) => d.progress_type === "checklist",
        );
        const updatedChecklists = checklistsData.data.map(
          (item: any, index: number) => {
            const progress = checklistProgress?.find(
              (p: any) => p.id === item.id || p.id === item.todo_id,
            );
            return {
              ...item,
              completed_at: checklistProgress[index]?.completed_at || null,
              progress_id: checklistProgress[index]?.id || null,
            };
          },
        );
        setCheckList(updatedChecklists);
      } else if (!data?.error) {
        setCheckList(checklistsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
      setCheckList(checklistsData.data || []);
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    if (shouldBlockForStudent || props.isPreview) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const uploadFiles = async (taskId: number | string, files: File[]) => {
    if (responseFiles!.length > 0 && files[0]) {
      const prevFiles = responseFiles
        ? responseFiles.map((f) => {
            if (f instanceof File) {
              return new File([f], encodeURIComponent(f.name), {
                type: f.type,
                lastModified: f.lastModified,
              });
            } else {
              return f;
            }
          })
        : [];
      await updateFiles(
        [
          new File([files[0]], encodeURIComponent(files[0].name), {
            type: files[0].type,
            lastModified: files[0].lastModified,
          }),
        ],
        taskId,
        prevFiles,
        false,
        true,
        taskAssId,
      );
    } else {
      await uploadFilesToS3(
        [
          new File([files[0]], encodeURIComponent(files[0].name), {
            type: files[0].type,
            lastModified: files[0].lastModified,
          }),
        ],
        Number(taskId),
        null,
        false,
        true,
        taskAssId,
      );
    }
  };

  const allChecklistsCompleted = useMemo(() => {
    if (!checkLists || checkLists.length === 0) return true;
    return checkLists.every(
      (item: any) =>
        item.completed_at !== null && item.completed_at !== undefined,
    );
  }, [checkLists]);

  const uncheckedCount = useMemo(() => {
    if (!checkLists || checkLists.length === 0) return 0;
    return checkLists.filter((item: any) => !item.completed_at).length;
  }, [checkLists]);

  const getFilePreview = (file: any) => {
    const fileName = file?.name || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const fileUrl = `${process.env.REACT_APP_S3_BASE_URL}/${file?.s3BucketName}/${file?.s3Key}`;

    if (file.type?.includes("image")) {
      if (!file?.s3Key) return <Tag color="geekblue">FILE HERE</Tag>;
      return (
        <div
          className={style.files_content}
          style={{ width: "100%", textAlign: "center" }}
        >
          <div className={style.imageContainer}>
            <img
              src={fileUrl}
              alt={fileName}
              style={{
                maxWidth: "100%",
                maxHeight: "40vh",
                borderRadius: "8px",
                filter: shouldBlockForStudent ? "grayscale(30%)" : "none",
              }}
            />
          </div>
        </div>
      );
    }

    const docExtensions = [
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "pdf",
      "csv",
      "msg",
    ];

    if (docExtensions.includes(extension)) {
      let iconColor = "#2b5d8a";
      if (extension.includes("xls")) iconColor = "#217346";
      if (extension.includes("ppt")) iconColor = "#d24726";
      if (extension.includes("pdf")) iconColor = "#b30b00";

      return (
        <div className={style.files_content}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "10px",
              opacity: shouldBlockForStudent ? 0.7 : 1,
              cursor: shouldBlockForStudent ? "not-allowed" : "default",
            }}
          >
            <FileTextOutlined style={{ fontSize: "2rem", color: iconColor }} />
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fileName}
            </div>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(fileUrl, fileName)}
              size="large"
              disabled={shouldBlockForStudent}
            />
          </div>
        </div>
      );
    }

    if (file.type?.includes("audio") || file.type?.includes("octet-stream")) {
      return (
        <div
          style={{
            marginBottom: "15px",
            background: "#f0f2f5",
            padding: "15px",
            borderRadius: "10px",
            opacity: shouldBlockForStudent ? 0.7 : 1,
          }}
        >
          <div
            id={`waveform-${file.id}`}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <WaveSurferComponent url={fileUrl} fileName={fileName} />
        </div>
      );
    }

    if (file.type?.includes("video")) {
      return (
        <div
          style={{
            marginBottom: "10px",
            width: "100%",
            background: "#000",
            borderRadius: "8px",
            overflow: "hidden",
            opacity: shouldBlockForStudent ? 0.7 : 1,
          }}
        >
          <ReactPlayer
            url={fileUrl}
            width="100%"
            height="100%"
            controls={!isSubmitted}
            light={false}
            style={{ aspectRatio: "16/9" }}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "5px",
          opacity: shouldBlockForStudent ? 0.7 : 1,
        }}
      >
        <FileJpgOutlined style={{ fontSize: "1.5rem" }} />
        <span>{fileName}</span>
        <Button
          icon={<DownloadOutlined />}
          href={shouldBlockForStudent ? undefined : fileUrl}
          download={fileName}
          size="small"
          disabled={shouldBlockForStudent}
          onClick={(e) => {
            if (shouldBlockForStudent) {
              e.preventDefault();
            }
          }}
        />
      </div>
    );
  };

  const handleCancelSubmit = async (taskAssignmentId: number | string) => {
    try {
      setIsCancelling(taskAssignmentId as any);

      const result = await cancelTaskSubmission(taskAssignmentId);

      if (result?.success) {
        message.success("ההגשה בוטלה בהצלחה");
        // עדכון הסטייט המקומי כדי להציג את כפתור ההגשה
        props.setOpenModal(false);

        // רענון הנתונים
        setTimeout(() => {
          props.onRefresh?.();
        }, 100);
      } else {
        message.error(result?.message || "אירעה שגיאה");
      }
    } catch (error) {
      console.error("Error cancelling submission:", error);
      message.error("אירעה שגיאה בביטול");
    } finally {
      setIsCancelling(null);
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const fileIndexes = useMemo(() => {
    return completedAssMissions
      .map((item, idx) => (item.progress_type === "file" ? idx : -1))
      .filter((idx) => idx !== -1);
  }, [completedAssMissions]);

  const nonFileMissions = completedAssMissions.filter(
    (m) => m.progress_type !== "file",
  );

  const hasFiles = taskReletedFiles && taskReletedFiles.length > 0;

  const hasForm = !props.isPreview && task?.parentForm;
  const hasSurvey = !props.isPreview && task?.surveyId ? true : false;

  const hasLinks = task?.linkUrl || (props.isPreview && props.task.linkUrl);
  // const hasForm = task?.parentForm;

  const hasChecklist = checkLists && checkLists.length > 0;

  // ═══════════════════════════════════════════════════════
  // עדכון: שימוש ב-effectivePermission במקום selectedPermission
  // ═══════════════════════════════════════════════════════
  const isStudent = effectivePermission === "STUDENT";
  const hasTags =
    effectivePermission !== "STUDENT" &&
    tagsData?.data?.tags &&
    tagsData?.data?.tags.length > 0;

  const hasPatbass =
    patbassFile && patbassFile.length > 0 && effectivePermission !== "STUDENT";
  const hasFeedback = !!(
    props.task?.feedbackId ||
    props.task?.Task?.feedbackId ||
    props.task?.task_feedback ||
    task?.feedbackId ||
    task?.Task?.feedbackId ||
    task?.Feedback?.id
  );

  const feedbackIdFromTask =
    props.task?.feedbackId ||
    props.task?.Task?.feedbackId ||
    props.task?.task_feedback?.id ||
    null;

  const isFeedbackFilled = !!(
    feedbackStatus?.filled && feedbackStatus?.isViewable
  );
  const hasResponseFiles =
    effectivePermission !== "STUDENT" &&
    responseFiles &&
    responseFiles.length > 0;

  const studentNeededToFileResponse = task?.filesResponse;
  const getStatusBadge = () => {
    const isFormCompleted = props.task?.form_completed_at !== null;
    const hasScore = props?.task?.scorePercentage !== null;
    const isNotStudent = effectivePermission !== "STUDENT";

    if (!isFormCompleted || props.isPreview) {
      return {
        label: "לא בוצע",
        bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        color: "#d97706",
        border: "#fcd34d",
      };
    }

    if (isFormCompleted && !hasScore && !isNotStudent) {
      return {
        label: "בבדיקה",
        bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        color: "#2563eb",
        border: "#93c5fd",
      };
    }

    if (isFormCompleted && !hasScore && isNotStudent) {
      return {
        label: "ממתין לציון",
        bg: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
        color: "#a855f7",
        border: "#e879f9",
      };
    }

    return {
      label: "הושלם",
      bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
      color: "#059669",
      border: "#a7f3d0",
    };
  };

  const status = getStatusBadge();

  const showViewAsSwitch = selectedPermission !== "STUDENT";

  return (
    <div style={{ width: "100%", direction: "ltr" }}>
      <Modal
        open={props.openModal}
        width={"60vw"}
        className={style.modal}
        onCancel={handleClose}
        footer={null}
      >
        <div className={style.modal_mission_view}>
          <div className={style.inputs_wrapper}>
            {assignerName && (
              <div
                style={{
                  color: "#888",
                  fontSize: "13px",
                  marginLeft: "5px",
                  marginBottom: "8px",
                  marginTop: "15px",
                  direction: "rtl",
                }}
              >
                שובץ על ידי: <strong>{assignerName}</strong>
              </div>
            )}
            {/* ═══════════════════════════════════════════════════════
                הסוויץ' למבט חניך
            ═══════════════════════════════════════════════════════ */}
            {showViewAsSwitch && !props.isPreview && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "16px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: "#595959",
                    fontSize: "14px",
                  }}
                >
                  מצב צפייה:
                </span>

                <Switch
                  checked={viewAsStudent}
                  onChange={(checked) => setViewAsStudent(checked)}
                  checkedChildren="חניך"
                  unCheckedChildren="גבוה"
                  style={{
                    background: viewAsStudent ? "#d97706" : "#059669",
                  }}
                />
              </div>
            )}
            <div className={style.task_name}>
              {task?.name || (props.isPreview && props.task.name)}{" "}
            </div>
            <div className={style.task_descripation}>
              {task?.description || (props.isPreview && props.task.description)}
            </div>
            <div className={style.relevant_missions}>
              {showViewAsSwitch &&
                !props.isPreview &&
                !viewAsStudent &&
                props.showFeedbackButton !== false &&
                (props.task?.feedbackId ||
                  props.task?.Task?.feedbackId ||
                  props?.task?.task_feedback) && (
                  <div className={style.files_content}>
                    <div style={{ direction: "rtl", width: "36.1vw" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          padding: "16px",
                          background:
                            "linear-gradient(135deg, #ffffffff 0%, #dbdcdfff 100%)",
                          borderRadius: "10px",
                          border: "1px solid #b3b5b8ff",
                          marginBottom: "16px",
                        }}
                      >
                        <Button
                          type="primary"
                          icon={<EditOutlined />}
                          onClick={handleFillFeedback}
                          style={{
                            backgroundColor: "#222224ff",
                            borderColor: "#3a3d3dff",
                            fontWeight: 600,
                          }}
                          size="large"
                        >
                          מלא משוב על חניך זה
                        </Button>

                        <span
                          style={{
                            color: "#000000ff",
                            fontSize: "13px",
                            direction: "rtl",
                          }}
                        >
                          פתח את טופס המשוב בשביל לתת משוב על המשימה הזו
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              {/* ═══════════════════════════════════════════════════════
                  משוב עבור החניך - צפייה / ממתין לבדיקה
              ═══════════════════════════════════════════════════════ */}
              {!props.isPreview &&
                isStudent &&
                hasFeedback &&
                props.showFeedbackButton !== false && (
                  <div className={style.files_content}>
                    <div style={{ direction: "rtl", width: "36.1vw" }}>
                      {isFeedbackFilled ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "16px",
                            padding: "16px",
                            background:
                              "linear-gradient(135deg, #ffffffff 0%, #dbdcdfff 100%)",
                            borderRadius: "10px",
                            border: "1px solid #b3b5b8ff",
                            marginBottom: "16px",
                            direction: "rtl",
                          }}
                        >
                          <span
                            style={{
                              color: "#000000ff",
                              fontSize: "13px",
                              direction: "rtl",
                            }}
                          >
                            המשוב מולא - לחץ לצפייה
                          </span>
                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={handleViewFeedback}
                            style={{
                              backgroundColor: "#222224ff",
                              borderColor: "#3a3d3dff",
                              fontWeight: 600,
                            }}
                            size="large"
                          >
                            לצפייה במשוב
                          </Button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            padding: "16px",
                            background:
                              "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                            borderRadius: "10px",
                            border: "1px solid #fcd34d",
                            marginBottom: "16px",
                            direction: "rtl",
                          }}
                        >
                          <ClockCircleOutlined
                            style={{
                              color: "#d97706",
                              fontSize: "16px",
                            }}
                          />
                          <span
                            style={{
                              color: "#92400e",
                              fontSize: "14px",
                              fontWeight: 500,
                            }}
                          >
                            לאחר בדיקת המשוב תוכל להיכנס מכאן לצפייה במשוב
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              <div className={style.files_content}>
                <div style={{ direction: "rtl", width: "36.1vw" }}>
                  <NoteForStudent
                    taskAssignmentId={taskAssId}
                    isStudent={effectivePermission === "STUDENT"}
                  />
                </div>
              </div>
              {hasLinks && (
                <div className={style.link_content}>
                  <div className={style.linksLabel}>קישורים</div>
                  <div style={{ direction: "rtl", width: "36.1vw" }}>
                    <div
                      className={style.input_wrapper}
                      onClick={(e) => {
                        if (shouldBlockForStudent || props.isPreview) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        window.open(task?.linkUrl, "_blank");
                      }}
                      style={
                        shouldBlockForStudent
                          ? {
                              opacity: 0.6,
                              cursor: "not-allowed",
                              background: "#e5e7eb",
                            }
                          : {}
                      }
                    >
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: shouldBlockForStudent ? "#9ca3af" : "#2b5d8a",
                          pointerEvents: shouldBlockForStudent
                            ? "none"
                            : "auto",
                        }}
                        onClick={(e) => {
                          if (shouldBlockForStudent || props.isPreview) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                      >
                        {task?.linkUrl || props.task.linkUrl}
                      </span>
                      <img
                        src={twoIcon}
                        style={{
                          width: "1.2rem",
                          marginTop: ".5vh",
                          opacity: shouldBlockForStudent ? 0.5 : 1,
                        }}
                        className={style.svgs}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(hasForm || (props.isPreview && props?.task?.form_name)) && (
                <div className={style.form_content}>
                  <div className={style.filesLabel}>מבחן</div>
                  <div style={{ direction: "rtl", width: "36.1vw" }}>
                    <div
                      onClick={() => {
                        if (shouldBlockForStudent || props.isPreview) return;

                        const isFormCompleted =
                          props.task?.form_completed_at !== null;
                        const hasScore = props?.task?.scorePercentage !== null;
                        const isStudentUser = effectivePermission === "STUDENT";

                        if (!isFormCompleted && isStudentUser) {
                          navigate(
                            `/forms/answer/${props.task?.task_assignment_id}`,
                          );
                          return;
                        }
                        if (!isFormCompleted && !isStudentUser) {
                          return Notification({
                            type: "error",
                            msg: "רק חניך יכול לענות על המבחן!",
                          });
                        }
                        if (isFormCompleted && !hasScore && isStudentUser) {
                          Notification({
                            type: "error",
                            msg: "מבחן זה בבדיקה!",
                          });
                          return;
                        }
                        if (isFormCompleted && !hasScore && !isStudentUser) {
                          navigate(
                            `/forms/grading?taskId=${props?.task?.task_id}&teamId=${selectedTeam.id}`,
                          );
                          return;
                        }
                        navigate(
                          `/forms/show/${props.task?.task_assignment_id}`,
                        );
                      }}
                      className={style.input_wrapper}
                      style={
                        shouldBlockForStudent
                          ? {
                              opacity: 0.6,
                              cursor: "not-allowed",
                              background: "#e5e7eb",
                            }
                          : {}
                      }
                    >
                      <div>
                        {task?.parentForm?.title || props?.task?.form_name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "12vh",
                          pointerEvents: "none",
                        }}
                      >
                        <span
                          className={style.statusBadge}
                          style={{
                            background: status.bg,
                            color: status.color,
                            borderColor: status.border,
                          }}
                        >
                          <span
                            className={style.statusDot}
                            style={{ backgroundColor: status.color }}
                          />
                          {status.label}
                        </span>
                        <img
                          src={eightIcon}
                          style={{
                            width: "1.5rem",
                            opacity: shouldBlockForStudent ? 0.5 : 1,
                          }}
                          className={style.svgs}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {(hasSurvey || (props.isPreview && props.task.surveyName)) && (
                <div className={style.form_content}>
                  <div className={style.filesLabel}>סקר</div>
                  <div
                    onClick={() => {
                      if (shouldBlockForStudent || props.isPreview) return;

                      navigate(
                        `/forms/answer/${props.task?.task_assignment_id}?isSurvey=true`,
                      );
                    }}
                    className={style.input_wrapper}
                    style={
                      shouldBlockForStudent
                        ? {
                            opacity: 0.6,
                            cursor: "not-allowed",
                            background: "#e5e7eb",
                          }
                        : {}
                    }
                  >
                    <div>{task?.survey?.title || props.task.surveyName}</div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "12vh",
                      }}
                    >
                      <img
                        src={eightIcon}
                        style={{
                          width: "1.5rem",
                          opacity: shouldBlockForStudent ? 0.5 : 1,
                        }}
                        className={style.svgs}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(hasChecklist ||
                (props.isPreview && props.task.checkLists?.length > 0)) && (
                <div className={style.files_content}>
                  <div className={style.checklistLabel}>צ'ק ליסט</div>
                  <div style={{ direction: "rtl", width: "36.1vw" }}>
                    <div
                      style={{
                        pointerEvents: isSubmitted ? "none" : "auto",
                        opacity: isSubmitted ? 0.8 : 1,
                      }}
                    >
                      {/* ══════════════════════════════════════════
            תיקון: CheckList אחד עם כל הצ'קליסטים
            לא צריך map על שום דבר!
            ══════════════════════════════════════════ */}
                      <CheckList
                        // need to check why update only 1 todo ===>>>>>
                        key="main-checklist"
                        setCheckLists={setCheckList}
                        checkLists={
                          !props.isPreview ? checkLists : props.task.checkLists
                        }
                        showHeader={false}
                        setIsCompleted={(id: any) => {
                          if (isSubmitted || props.isPreview) return;
                          setCheckList((prev: any) =>
                            prev.map((item: any) =>
                              item.id === id
                                ? { ...item, completed_at: new Date() }
                                : item,
                            ),
                          );
                        }}
                        setIsNotCompleted={(id: any) => {
                          if (isSubmitted || props.isPreview) return;
                          setCheckList((prev: any) =>
                            prev.map((item: any) =>
                              item.id === id
                                ? { ...item, completed_at: null }
                                : item,
                            ),
                          );
                        }}
                        userRole="user"
                        todos={
                          !props.isPreview
                            ? checkLists?.map((t: any) => {
                                const progressMission =
                                  completedAssMissions.find(
                                    (m: any) =>
                                      m.progress_type === "checklist" &&
                                      m.id == t.progress_id,
                                  );

                                return {
                                  todo: t.todo,
                                  completed_at: t.completed_at,
                                  id: t.id,
                                  progress_id: progressMission?.id,
                                };
                              })
                            : props.isPreview &&
                              props.task.checkLists?.length > 0 &&
                              props.task.checkLists?.map((t: any) => {
                                return {
                                  todo: t.toDo,
                                  id: t.id,
                                };
                              })
                        }
                        width="100%"
                        isPreview={props.isPreview}
                      />
                    </div>
                  </div>
                </div>
              )}

              {hasFiles && (
                <div className={style.files_content}>
                  <div className={style.filesLabel}>קבצים שצורפו למשימה :</div>
                  <div style={{ direction: "rtl", width: "36.1vw" }}>
                    {taskReletedFiles.map((element) => {
                      const file = element;

                      const showFile =
                        !file?.isPatbass || selectedPermission !== "STUDENT";
                      return showFile && file ? (
                        <div key={file.id} style={{ marginBottom: "10px" }}>
                          {getFilePreview(file)}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {props.isPreview && props.task.filesResponse && (
                <div className={style.files_content}>
                  <div className={style.filesLabel}>
                    החייל ידרש להעלות קבצים למשימה
                  </div>
                  {/*     <div style={{ direction: "rtl", width: "36.1vw" }}>
                    {props.task.filesPathes.map((element: any) => {
                      const file = element;
                   
                      const showFile = !file?.isPatbass || effectivePermission !== "STUDENT";
                      return showFile && file ? (
                        <div key={file.id} style={{ marginBottom: "10px" }}>
                          {getFilePreview(file)}
                        </div>
                      ) : null;
                    })}
                  </div> */}
                </div>
              )}

              {hasPatbass && (
                <div className={style.files_content}>
                  <div className={style.patbassLabel}>פתב"ס</div>
                  <div style={{ direction: "rtl", width: "36.1vw" }}>
                    {patbassFile?.map((element: any) => {
                      const file = element;
                      const showFile =
                        !file?.isPatbass || selectedPermission !== "STUDENT";
                      return showFile && file ? (
                        <div key={file.id} style={{ marginBottom: "15px" }}>
                          {getFilePreview(file)}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {isStudent &&
                studentNeededToFileResponse /* ||
                (props.isPreview && props.task.filesResponse) */ && (
                  <div className={style.files_response_content}>
                    <div className={style.addFilesLabel}>
                      הגשת קבצים למשימה :
                    </div>
                    <div className={style.fileContainer}>
                      <UploadFiles
                        isPreview={props.isPreview}
                        taskId={props.taskId}
                        taskReletedFiles={filesToUpload}
                        onFileUploaded={async (files: File[]) => {
                          if (props.isPreview) return;
                          uploadFiles(Number(props.taskId), files);
                        }}
                        width={34}
                      />
                    </div>
                  </div>
                )}

              {hasTags && (
                <div className={style.tagsSection}>
                  <div className={style.tagsLabel}>תיוגים</div>
                  <div className={style.tagsContainer}>
                    {tagsData?.data?.tags?.map((tag: any) => (
                      <Tag key={tag.id}>{tag.tagName}</Tag>
                    ))}
                  </div>
                </div>
              )}

              {hasResponseFiles && (
                <div className={style.files_content}>
                  <div className={style.filesUploadedLabel}>
                    קבצים שהחניך העלה
                  </div>
                  <div style={{ direction: "rtl", width: "36.1vw" }}>
                    {responseFiles.map((file, i) => (
                      <div key={file.id ?? i} style={{ marginBottom: "10px" }}>
                        {getFilePreview(file)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {studentNeededToFileResponse &&
                !isStudent &&
                !hasResponseFiles && (
                  <div className={style.files_content}>
                    <div style={{ direction: "rtl", width: "36.1vw" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "25px",
                          background:
                            "linear-gradient(135deg, #ffffffff 0%, #dbdcdfff 100%)",
                          borderRadius: "10px",
                          border: "1px solid #bbbcbeff",
                          direction: "rtl",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "15px",
                            color: "#000000ff",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          ️ החניך טרם העלה קבצים למשימה
                        </span>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {(props.task?.Task?.recommendedTime ||
              props.task?.recommendedTime) &&
              effectivePermission === "STUDENT" &&
              !props.isPreview && (
                <div
                  className={style.submitSection}
                  style={{
                    zIndex: 20,
                    position: "relative",
                    pointerEvents: "auto",
                  }}
                >
                  {!props.completed_at ? (
                    <Popconfirm
                      title="האם אתה בטוח שברצונך להגיש את המשימה?"
                      description={
                        !allChecklistsCompleted ? (
                          <div style={{ direction: "rtl", textAlign: "right" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                                color: "#d97706",
                                marginBottom: "8px",
                              }}
                            >
                              <ExclamationCircleOutlined
                                style={{ fontSize: "16px", marginTop: "3px" }}
                              />
                              <div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    marginBottom: "4px",
                                  }}
                                >
                                  שים לב! נותרו פריטים שלא מולאו בצ'ק ליסט
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#92400e" }}
                                >
                                  {uncheckedCount} פריט/ים לא הושלמו. האם אתה
                                  בטוח שברצונך להגיש בכל זאת?
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : undefined
                      }
                      onConfirm={() => handleSubmitTask(taskAssId)}
                      okText="כן, הגש"
                      cancelText="ביטול"
                      placement="topRight"
                      icon={
                        <ExclamationCircleOutlined
                          style={{
                            color: !allChecklistsCompleted
                              ? "#d97706"
                              : "#1890ff",
                          }}
                        />
                      }
                    >
                      <button
                        className={style.submitBtn}
                        disabled={isSubmitting === taskAssId}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {isSubmitting === taskAssId ? (
                          <Spin
                            indicator={
                              <LoadingOutlined style={{ fontSize: 14 }} spin />
                            }
                          />
                        ) : (
                          <>
                            <SendOutlined />
                            <span>הגש משימה</span>
                          </>
                        )}
                      </button>
                    </Popconfirm>
                  ) : (
                    <div className={style.submittedContainer}>
                      <div className={style.submittedBadge}>
                        <CheckCircleOutlined />
                        <span>המשימה הוגשה</span>
                        <span className={style.submittedDate}>
                          {formatDate(props.completed_at)}
                        </span>
                      </div>
                      <Tooltip title="בטל הגשה">
                        <button
                          className={style.cancelBtn}
                          disabled={isCancelling === taskAssId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelSubmit(taskAssId);
                          }}
                        >
                          {isCancelling === taskAssId ? (
                            <Spin
                              indicator={
                                <LoadingOutlined
                                  style={{ fontSize: 12 }}
                                  spin
                                />
                              }
                            />
                          ) : (
                            <UndoOutlined />
                          )}
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserTaskModal;
