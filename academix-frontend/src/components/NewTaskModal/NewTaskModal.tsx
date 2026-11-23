import api from "../../api/axios";
import React, { useEffect, useMemo, useState } from "react";
import style from "./NewTaskModal.module.css";

import { Button, Modal, notification, Spin, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  EyeOutlined,
  LockOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import AddTaskBox, { BoxProps } from "./AddTaskBox/AddTaskBox";
import editIcon from "../../media/svg/Edit Icon.svg";
import twoIcon from "../../media/svg/solarlink-outline.svg";
import threeIcon from "../../media/svg/material-symbols-lightlist-rounded.svg";
import fiveIcon from "../../media/svg/uitprocess.svg";
import sixIcon from "../../media/svg/lets-iconstime-light.svg";
import sevenIcon from "../../media/svg/material-symbols-lightfeedback-outline.svg";
import eightIcon from "../../media/svg/healthiconsi-exam-qualification-outline.svg";
import nineIcon from "../../media/svg/lets-iconsquestion-light.svg";
import {
  Task,
  updateCheckListToDB,
  uploadCheckListToDB,
  uploadFilesToS3,
  useTaskStore,
  updateFiles,
} from "../../store/taskStore";
import { EyeInvisibleOutlined } from "@ant-design/icons";
import StringInput from "./Inputs/StringInput/StringInput";
import RecommendedTime from "./Inputs/RecommendedTime/RecommendedTime";
import CheckList from "./Inputs/CheckList/CheckList";
import GradeStage from "./Inputs/GradeStage/GradeStage";
import Survey from "./Inputs/Survey/Survey";
import UploadFiles from "./Inputs/UploadFiles/UploadFiles";
import ResponseFile from "./Inputs/ResponseFile/ResponseFile";
import { useUserStore } from "../../store/userStore";
import { useSelectionsStore } from "../../store/selectionStore";
import { useQueryClient } from "@tanstack/react-query";
import { emptyAxisTemplate, useAxisTemplateQuery } from "../../hooks/useAxisTemplateQuery";
import { useFetchCheckListsByTaskId } from "../../hooks/useFetchCheckListsByTaskId";
import { useFetchFilesByTaskId } from "../../hooks/useFetchFilesByTaskId";
import { isEqual } from "es-toolkit/compat";
import CastingAssignments from "./CastingAssignments/CastingAssignments";
import ColorPicker from "./Inputs/ColorPicker/ColorPicker";
import { useFetchTagsByTaskId } from "../../hooks/useFetchTagsByTaskId";
import EditableTagGroup from "./Inputs/Tags/Tags";
import { AxisTemplate, rules } from "../../types/types";
import Scheduling from "./Inputs/Scheduling/Scheduling";
import { usePermissionStore } from "../../store/permissionStore";
import {
  FieldTimeOutlined,
  TagsOutlined,
  BgColorsOutlined,
  AuditOutlined
} from "@ant-design/icons";
import { Input } from "antd";
import { UserTaskModal } from "../LazyTaskModals";
import CheckListForOverlap from "./Inputs/CheckListForOverlap/CheckListForOverlap";
import BlackButton from "../../UI/Button/BlackButton";
import { useBlockColorStore } from "../../store/blockColorStore";

const cleanCheckListItems = (checklist: any[] | null | undefined) => {
  if (!Array.isArray(checklist)) return [];
  return checklist.filter(
    (item: any) =>
      item &&
      typeof item.toDo === "string" &&
      item.toDo.trim().length > 0
  );
};

export type TaskGroup = {
  tasks: Task[] | any;
  id?: number | string;
};
type Mode = "train" | "soldier";

export type NewMissionProps = {
  taskGroup: TaskGroup;
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  editingTask?: Task | null;
  taskGroupId?: number;
  taskGroupTitle?: string;
  axisId?: number;
  locked?: boolean;
  setSelectedTask: React.Dispatch<React.SetStateAction<any>>;
  AxisColor?: string;
  filterOption?: any;
  onTasksChanged: any;
};

const NewTaskModal = (props: NewMissionProps) => {
  const [exposureEnabled, setExposureEnabled] = useState<boolean>(false);
  const taskInStore = useTaskStore((state) => state.task);

  const setTaskInStore = useTaskStore((state) => state.updateTask);
  const userInStore = useUserStore((state) => state.user);
  const { selectedPermission } = usePermissionStore();
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [taskFromDB, setTaskFromDB] = useState<any>();
  const [taskName, setTaskName] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [taskOverlapDescription, setTaskOverlapDescription] =
    useState<string>("");
  const [checklistsForOverlap, setChecklistsForOverlap] = useState<any[]>([]);
  const [color, setColor] = useState<any>();
  const queryClient = useQueryClient();
  const { selectedCourseBatch } = useSelectionsStore();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [recommendedTime, setRecommendedTime] = useState<number | null>(
    taskInStore?.recommendedTime || null
  );
  const [taskReletedCheckLists, setTaskReletedCheckLists] = useState<any[]>();
  const [formId, setFormId] = useState<number | null>(null);
  const [surveyId, setSurveyId] = useState<number | null>(null);
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  const [gradeStageId, setgradeStageId] = useState<number | null>(null);
  const [taskReletedFiles, setTaskReletedFiles] = useState<any[]>();
  const [taskSolutionFile, setTaskSolutionFile] = useState<any[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [taskTags, setTaskTags] = useState<any[]>([]);
  const [fileRes, setFileRes] = useState<boolean>(false);
  const checkLists = useFetchCheckListsByTaskId(Number(props.editingTask?.id));
  const fileData = useFetchFilesByTaskId(Number(props.editingTask?.id));
  const tagsData = useFetchTagsByTaskId(Number(props.editingTask?.id));
  const [hasCheckList, setHasCheckList] = useState<any[]>([]);
  const [hasFiles, setHasFiles] = useState<any[]>([]);
  const { activeHeaderType, selectedTeam } = useSelectionsStore();
  // items: see the axis template query below
  const { refetch: refetchCheckLists } = checkLists;
  const { refetch: refetchFileData } = fileData;
  const { refetch: refetchTagData } = tagsData;
  const [schedulingEnabled, setSchedulingEnabled] = useState<boolean>(false);
  const [startMinutesBefore, setStartMinutesBefore] = useState<number | null>(
    null
  );
  const [endMinutesAfter, setEndMinutesAfter] = useState<number | null>(null);
  const [isChange, setIsChange] = useState<boolean>(false);
  const [hadSchedulingOverride, setHadSchedulingOverride] =
    useState<boolean>(false);

  const [notRequiredToSubmit, setNotRequiredToSubmit] =
    useState<boolean>(false);
  const [notRequiredToCheck, setNotRequiredToCheck] = useState<boolean>(false);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("soldier");

  const { isBlockColorEnabled } = useBlockColorStore();

  const [openUserTaskModal, setOpenUserTaskModal] = useState(false);
  const [previewTask, setPreviewTask] = useState<any>(null);
  const [previewFiles, setPreviewFiles] = useState<any>();

  const allowToEdit = [
    "פתרון תרגיל",
    "משוב",
    "צבע",
    "שלב בהסמכה",
    "תיוגים",
    "תזמון",
    "חשיפה",
  ];

  const handleOpenPreview = () => {
    if (!previewFiles)
      setPreviewFiles(() => {
        return taskInStore.filesPathes;
      });

    const taskForPreview = {
      task_id: props.editingTask?.id || null,
      task_assignment_id: null,
      name: taskName,
      description: taskDescription,
      linkUrl: linkUrl,
      recommendedTime: recommendedTime,
      form_name: taskInStore?.parentForm?.title,
      surveyName: taskInStore?.survey?.title,
      checkLists: taskInStore.checkList,
      filesPathes: taskInStore.filesPathes || previewFiles,
      filesResponse: taskInStore.filesResponse,
    };

    setPreviewTask(taskForPreview);
    setOpenUserTaskModal(true);
  };
  useEffect(() => {
    setTaskInStore({
      ...taskInStore,
      formId: formId,
      surveyId: surveyId,
      parentForm: formId ? { id: formId, title: "שאלון" } : null,
      survey: surveyId ? { id: surveyId, title: "סקר" } : null,
    });
  }, [formId, surveyId]);
  // The axis template (which task fields are required): read-only here; edited in
  // EditTemplateAxisModal. null until loaded; no template = nothing required.
  const { data: axisTemplate } = useAxisTemplateQuery(props.axisId);
  const items: AxisTemplate | null = useMemo(
    () =>
      axisTemplate === undefined || !props.axisId
        ? null
        : axisTemplate ?? emptyAxisTemplate(props.axisId),
    [axisTemplate, props.axisId]
  );

  useEffect(() => {
    if (!props.editingTask) {
      resetAll();
    }
    /*    queryClient.invalidateQueries({
      queryKey: ["task-users"],
    }); */
  }, []);

  useEffect(() => {
    if (hasCheckList.length <= 0 && taskInStore.checkList) {
      setHasCheckList(taskInStore.checkList);
    }
  }, [taskInStore.checkList, taskInStore.filesPathes]);

  useEffect(() => {
    const files = taskInStore.filesPathes;
    if (Array.isArray(files) && files.length > 0 && !hasFiles.length) {
      setHasFiles(files);
    }
  }, [taskInStore.filesPathes]);


  useEffect(() => {
    if (fileData?.data && !fileData?.data.error) {
      setTaskReletedFiles(
        fileData?.data.filter((f: any) => !f.isPatbass && !f.isFileResponse && f.feedback_answer_id != null )
      );
      setTaskSolutionFile(
        fileData?.data.filter((f: any) => f.isPatbass && !f.isFileResponse)
      );
    }
    if (Array.isArray(checkLists?.data)) {
      setTaskReletedCheckLists(checkLists.data);
    }
  }, [JSON.stringify(fileData?.data), JSON.stringify(checkLists?.data)]);

  useEffect(() => {
    if (tagsData?.data && !tagsData?.data.error)
      setTaskTags(tagsData?.data.tags);
  }, [tagsData]);

  useEffect(() => {
    if (props.editingTask?.id) {
      fetchChecklistsForOverlap(Number(props.editingTask.id));
    }
  }, [props.editingTask?.id]);

  const fetchChecklistsForOverlap = async (taskId: number) => {
    try {
      const response = await api.get(
        `/task-checklist-overlap/by-task/${taskId}`
      );
      if (response.data && response.data.length > 0) {
        setChecklistsForOverlap(
          response.data.filter(
            (item: any) => item?.todo && item.todo.trim() !== ""
          )
        );
      }
    } catch (error) {
      console.error("Error fetching checklists for overlap:", error);
    }
  };
  const fetchSchedulingData = async (taskId: number) => {
    if (!selectedTeam?.id) return;
    try {
      const visibilityRes = await api.get(
        `/task-visibility-overrides/${taskId}/${selectedTeam.id}`,
        { withCredentials: true }
      );
      if (visibilityRes.data?.data) {
        setSchedulingEnabled(true);
        setHadSchedulingOverride(true);
        setStartMinutesBefore(visibilityRes.data.data.start_minutes_before);
        setEndMinutesAfter(visibilityRes.data.data.end_minutes_after);
      }
    } catch (e) { }
  };

  const saveSchedulingData = async (taskId: number) => {
    if (!selectedTeam?.id) return;

    if (hadSchedulingOverride && !schedulingEnabled) {
      try {
        await api.delete(
          `/task-visibility-overrides/${taskId}/${selectedTeam.id}`,
          { withCredentials: true }
        );
      } catch (e: any) {
        console.log("Scheduling delete error:", e.response?.data);
      }
      return;
    }

    if (startMinutesBefore === null && endMinutesAfter === null) return;

    const data = {
      taskId: taskId,
      teamId: selectedTeam.id,
      startMinutesBefore: startMinutesBefore ?? 0,
      endMinutesAfter: endMinutesAfter ?? 0,
    };
    try {
      await api.post(
        `/task-visibility-overrides`,
        data,
        { withCredentials: true }
      );
    } catch (e: any) {
      console.log("Scheduling save error:", e.response?.data);
    }
  };

  const fetchTaskData = async (
    fileDataP: any,
    checkListsP: any,
    tagsP: any
  ) => {
    try {
      setIsLoading(true);
      const response = await api.get(
        `/tasks/getById/${props.editingTask?.id}`
      );

      const taskData = response.data;

      setTaskFromDB(taskData);
      setTaskName(taskData.name || "");
      setTaskDescription(taskData.description || "");
      setTaskOverlapDescription(taskData.description_to_overlap || "");
      setLinkUrl(taskData.linkUrl);
      setColor(taskData.color);

      setRecommendedTime(taskData.recommendedTime);
      setgradeStageId(taskData.gradeStageId);
      setFormId(taskData.formId);
      setFeedbackId(taskData.feedbackId);
      setSurveyId(taskData.surveyId);
      setFileRes(taskData.filesResponse || false);

      setNotRequiredToSubmit(taskData.notRequiredToSubmit || false);
      setNotRequiredToCheck(taskData.notRequiredToCheck || false);

      setTaskTags(tagsP?.tags || []);
      const rawCheckLists = checkListsP || [];
      const cleanCheckLists = rawCheckLists.filter(
        (cl: any) => cl?.todo && cl.todo.trim() !== ""
      );

      setHasCheckList(cleanCheckLists);
      setTaskReletedCheckLists(rawCheckLists);
      setHasFiles(
        fileDataP?.filter((f: any) => !f.isPatbass && !f.isFileResponse) || []
      );
      setTaskSolutionFile(
        fileDataP?.filter((f: any) => f.isPatbass && !f.isFileResponse) || []
      );
      setTaskReletedFiles(
        fileDataP?.filter((f: any) => !f.isPatbass && !f.isFileResponse &&
      f.feedback_answer_id === null ) || []
      );

      // בחר את סוגי המשימות שנבחרו

      const selectedTypes = [];
      if (
        fileDataP?.filter((f: any) => !f.isPatbass && !f.isFileResponse)
          ?.length > 0
      )
        selectedTypes.push(1);
      if (taskData.linkUrl) selectedTypes.push(2);
      if (checkListsP?.length > 0) selectedTypes.push(3);
      if (taskData.gradeStageId) selectedTypes.push(5);
      if (taskData.recommendedTime) selectedTypes.push(6);
      if (taskData.formId) selectedTypes.push(9);
      if (taskData.surveyId) selectedTypes.push(15);
      if (taskData.feedbackId) selectedTypes.push(7);
      if (taskData.filesResponse) selectedTypes.push(10);
      if (taskData.color) selectedTypes.push(12);
      if (taskData.exposure) selectedTypes.push(16);
      if (taskData.notRequiredToCheck) selectedTypes.push(18);
      if (tagsP.tags.length > 0) selectedTypes.push(13);
      if (
        fileDataP?.filter((f: any) => f.isPatbass && !f.isFileResponse)
          ?.length > 0
      )
        selectedTypes.push(11);

      setSelectedTasks(selectedTypes);

      setTaskInStore({
        ...taskInStore,
        ...taskData,
        id: taskData.id,
        tags: tagsP.tags,
        checkList: cleanCheckLists.map((element: any) => ({
          toDo: element.todo,
          done: false,
        })),
        // filesPathes: fileDataP,
        taskGroupId: props.taskGroup.id,
        solutionFilePathes: fileDataP?.filter(
          (f: any) => f.isPatbass && !f.isFileResponse
        ),
        filesPathes: fileDataP?.filter(
          (f: any) => !f.isPatbass && !f.isFileResponse
        ),
      });

      await fetchSchedulingData(taskData.id);

      if (taskData.exposure) {
        setExposureEnabled(true);
      }
    } catch (error) {
      console.error("Failed to fetch task data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (props.editingTask) {
      setIsLoading(true);
      Promise.all([refetchFileData(), refetchCheckLists(), refetchTagData()])
        .then(([fileDataResponse, checkListsResponse, tagsDataResponse]) => {
          fetchTaskData(
            fileDataResponse.data,
            checkListsResponse.data,
            tagsDataResponse.data
          );
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setIsLoading(false);
        });

      setIsEditing(true);
    } else {
      resetAll();
      setIsEditing(false);
    }
  }, [props.editingTask, props.openModal]);

  useEffect(() => {
    taskName?.trim().length > 0
      ? setTaskInStore({
        ...taskInStore,
        name: taskName,
      })
      : taskInStore.name?.trim().length > 0 &&
      setTaskInStore({
        ...taskInStore,
        name: "",
      });
  }, [taskName]);

  useEffect(() => {
    taskDescription?.trim().length > 0
      ? setTaskInStore({
        ...taskInStore,
        description: taskDescription,
      })
      : taskInStore.description?.trim().length > 0 &&
      setTaskInStore({
        ...taskInStore,
        description: "",
      });
  }, [taskDescription]);

  useEffect(() => {
    if (!props.openModal) {
      setTaskInStore({
        id: null,
        name: "",
        description: "",
        status: "operational",
        taskGroupId: "",
        estimatedMinutes: 0,
        creatorId: "",
        hidden: false,
      });
    } else {
      userInStore?.id &&
        setTaskInStore({
          ...taskInStore,
          creatorId: userInStore?.id,
          taskGroupId: Number(props.taskGroupId),
          status: "operational",
          formId: null,
          feedbackId: null,
        });
    }
  }, [props.openModal]);

  useEffect(() => {
    if (lastAddedId !== null) {
      const container = document.querySelector('[data-testid="inputs"]');
      if (container) {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }, 150);
      }
      setLastAddedId(null);
    }
  }, [lastAddedId]);

  const resetAll = () => {
    setIsChange(false);
    setHadSchedulingOverride(false);
    props.setSelectedTask(null);

    // שם ותיאור
    setTaskName("");
    setTaskDescription("");
    setLinkUrl("");

    // סעיפים נבחרים
    setSelectedTasks([]);

    setTaskDescription("");
    setTaskOverlapDescription("");

    // IDs של סעיפים
    setFormId(null);
    setSurveyId(null);
    setFeedbackId(null);
    setgradeStageId(null);

    // ערכים נוספים
    setColor(null);
    setHasCheckList([]);
    setHasFiles([]);
    setSchedulingEnabled(false);
    setStartMinutesBefore(null);
    setEndMinutesAfter(null);
    setNotRequiredToCheck(false);

    // קבצים
    setFileRes(false);
    setTaskSolutionFile(undefined);
    setTaskReletedFiles(undefined);
    setTaskReletedCheckLists(undefined);

    setNotRequiredToSubmit(false);

    // ══════════════════════════════════════════
    // החלק החשוב - taskInStore מאופס לגמרי!
    // ══════════════════════════════════════════
    setTaskInStore({
      id: null,
      name: "",
      description: "",
      hidden: false,
      status: "operational",
      taskGroupId: "",
      estimatedMinutes: 0,
      creatorId: "",
      formId: null,
      surveyId: null,
      feedbackId: null,
      linkUrl: "",
      color: props?.AxisColor,
      filesPathes: null,
      checkList: null,
      solutionFilePathes: null,
      tags: [],
      recommendedTime: null,
      gradeStageId: null,
      filesResponse: false,
      // requiresSubmission: false,
      team_id: null,
      notRequiredToSubmit: false,
      notRequiredToCheck: false,
      parentForm: null,
      survey: null,
    });
  };
  const handleClose: () => void = () => {
    setIsChange(false);
    resetAll();
    props.openModal && props.setOpenModal(false);
  };

  const HandleTaskBoxClick = (task: BoxProps): void => {
    let shouldClearTaskInStore = false;
    let fieldToClear: keyof Task | null = null;

    if (task.id === 6) {
      if (selectedTasks.includes(17)) {
        return;
      }
    } else if (task.id === 17) {
      if (selectedTasks.includes(6)) {
        return;
      }
    } else if (task.id === 14) {
      if (selectedTasks.includes(16)) {
        return;
      }
    } else if (task.id === 16) {
      if (schedulingEnabled) {
        return;
      }
    }

    const clearStateByTaskId = (taskId: number) => {
      switch (taskId) {
        case 1: // צירוף קבצים
          fieldToClear = "filesPathes";
          shouldClearTaskInStore = true;
          break;

        case 2: // קישור
          setLinkUrl("");
          fieldToClear = "linkUrl";
          shouldClearTaskInStore = true;
          break;

        case 3: // צ'ק ליסט
          fieldToClear = "checkList";
          shouldClearTaskInStore = true;
          break;

        case 5: // שלב בהסמכה
          setgradeStageId(null);
          fieldToClear = "gradeStageId";
          shouldClearTaskInStore = true;
          break;

        case 6: // משך זמן
          fieldToClear = "recommendedTime";
          shouldClearTaskInStore = true;
          break;

        case 7: // משוב
          setFeedbackId(null);
          fieldToClear = "feedbackId";
          shouldClearTaskInStore = true;
          break;

        case 9: // שאלונים
          setFormId(null);
          fieldToClear = "formId";
          shouldClearTaskInStore = true;
          break;

        case 10: // תגובת קובץ
          setFileRes(false);
          fieldToClear = "filesResponse";
          shouldClearTaskInStore = true;
          break;

        case 11: // פתרון תרגיל
          fieldToClear = "solutionFilePathes";
          shouldClearTaskInStore = true;
          break;

        case 12: // צבע
          setColor(null);
          fieldToClear = "color";
          shouldClearTaskInStore = true;
          break;

        case 13: // תיוגים
          setTaskTags([]);
          fieldToClear = "tags";
          shouldClearTaskInStore = true;
          break;
        case 14: // תיוגים
          setSchedulingEnabled(false);
          break;

        case 15: // סקרים
          setSurveyId(null);
          fieldToClear = "surveyId";
          shouldClearTaskInStore = true;
          break;
        case 16: // חשיפה
          setExposureEnabled(!exposureEnabled);
          fieldToClear = "exposure";
          shouldClearTaskInStore = true;
          break;

        case 17: // לא נדרש להגשה
          setNotRequiredToSubmit(!notRequiredToSubmit);
          shouldClearTaskInStore = true;
          fieldToClear = "notRequiredToSubmit";
          break;

        case 18: // לא נדרש בדיקה
          setNotRequiredToCheck(false);
          fieldToClear = "notRequiredToCheck";
          shouldClearTaskInStore = true;
          break;
      }
    };

    setIsChange(true);

    // ══════════════════════════════════════════════
    // הסרת סעיף
    // ══════════════════════════════════════════════

    if (task.selected) {
      // איפוס הסטייט המקומי
      if (props.locked && task.id == 7) return;

      if (task.id === 6 && selectedTasks.includes(10)) {
        notification.warning({
          key: `key-${Date.now()}`,
          message: "לא ניתן לבטל את 'חובת הגשה' כל עוד 'תגובת קובץ' נבחרת",
          duration: 3,
        });
        return;
      }

      clearStateByTaskId(task.id);

      // הסרה מהרשימה
      setSelectedTasks((prev) => prev.filter((id) => id !== task.id));

      // איפוס ב-store
      if (shouldClearTaskInStore && fieldToClear) {
        setTaskInStore({
          ...taskInStore,
          [fieldToClear]: null,
        });
      }
    } else {
      if (task.id === 14) {
        setSchedulingEnabled(true);

        return;
      }

      if (task.id === 10) {
        setFileRes(true);
        if (!selectedTasks.includes(6)) {
          setSelectedTasks((prev) => [...prev, 6]);
          setLastAddedId(6);
        }
        if (recommendedTime === null) {
          setRecommendedTime(59);
          setTaskInStore({
            ...taskInStore,
            recommendedTime: 59,
          });
        }
      }
      if (task.id === 16) {
        setExposureEnabled(true);
      }
      if (task.id === 17) {
        setNotRequiredToSubmit(true);
      }
      if (task.id === 18) {
        setNotRequiredToCheck(true);
      }

      setSelectedTasks((prev) => [...prev, task.id]);
      setLastAddedId(task.id);
    }
  };

  const isFileArray = (files: any): files is File[] => {
    if (!Array.isArray(files)) return false;
    if (files.length === 0) return false;
    return files.every((item) => item instanceof File);
  };

  function validateTask(items: any, task: any): boolean {
    if (!items) return true;

    for (const rule of rules) {
      if (!items[rule?.field]) continue;

      const ok = rule.customCheck ? rule.customCheck(task) : !!task[rule.field];
      if (!ok) {
        notification.error({
          key: `key-${Date.now()}`,
          message: rule.message,
          duration: 3,
        });
        return false;
      }
    }
    return true;
  }
  const handleSave: () => Promise<void> = async () => {
    if (
      taskInStore.name?.trim().length === 0 ||
      taskInStore.description?.trim().length === 0
    ) {
      notification.error({
        key: `key-${new Date()}`,
        message: "שם המשימה ותיאורה נדרשים",
        duration: 3,
      });
      return;
    }

    const currentRecommendedTime = taskInStore.recommendedTime;
    if (fileRes && !currentRecommendedTime) {
      notification.error({
        key: `key-${Date.now()}`,
        message: "יש להגדיר משך זמן לחובת הגשה",
        description: "כאשר 'תגובת קובץ' מופעלת, יש להגדיר משך זמן",
        duration: 4,
      });
      return;
    }

    if (items && !validateTask(items, taskInStore)) return;
    if (fileRes) {
      taskInStore.filesResponse = true;
    }

    if (!taskInStore?.color) {
      taskInStore.color = props?.AxisColor;
    }

    const uploadFiles = async (taskId: number | string) => {
      if (hasFiles.length > 0) {
        const files = taskInStore.filesPathes
          ? taskInStore.filesPathes.map((f) => {
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
        await updateFiles(files!!, taskId, files);
      } else if (
        taskInStore.filesPathes &&
        taskInStore.filesPathes?.length > 0 &&
        isFileArray(taskInStore.filesPathes)
      ) {
        try {
          const files = taskInStore.filesPathes.map((f) => {
            return new File([f], encodeURIComponent(f.name), {
              type: f.type,
              lastModified: f.lastModified,
            });
          }) as File[];
          await uploadFilesToS3(files, Number(taskId), null);
        } catch (error) {
          console.log("Failes Saving Files:(");
        }
      }
    };

    const handleUploadSolutionFiles = async (taskId: number | string) => {
      const solutionFiles = taskInStore.solutionFilePathes;

      try {
        const files = solutionFiles
          ? solutionFiles.map((f) => {
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
        await updateFiles(files, taskId, taskSolutionFile ?? [], true);
      } catch (error) {
        console.log("Failes Update Files:(");
      }
    };

    const updateFilesToS3 = async (taskId: number | string) => {
      try {
        const files = taskInStore.filesPathes
          ? taskInStore.filesPathes.map((f) => {
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
        await updateFiles(files, taskId, taskReletedFiles ?? []);
      } catch (error) {
        console.log("Failes Update Files:(");
      }
    };

    const uploadCheckList = async (taskId: number | string) => {
      const cleanedCheckList = cleanCheckListItems(taskInStore.checkList);

      if (cleanedCheckList.length > 0) {
        try {
          await uploadCheckListToDB(cleanedCheckList, taskId);
        } catch (error) {
          console.log("Failes Saving CheckList:(");
        }
      }
    };

    const updateCheckList = async (taskId: number | string, newCL: boolean) => {
      try {
        const cleanedCheckList = cleanCheckListItems(taskInStore.checkList);

        await updateCheckListToDB(
          cleanedCheckList,
          taskId,
          taskReletedCheckLists ?? [],
          newCL
        );
      } catch (error) {
        console.log("Failes Updating CheckList:(");
      }
    };

    const saveTaskTags = async (
      taskId: number | string,
      tags: { id?: number; name: string }[]
    ) => {
      const newTags = tags.filter((t) => t.id).map((t) => t.id!);

      if (taskId) {
        await api.delete(
          `/tasks/${taskId}/tags`,
          { withCredentials: true }
        );

        // ex. POST /tasks/:id/tags  body: [{ tagId: 1 }, { tagId: 2 }]
        if (newTags.length > 0) {
          await api.post(
            `/tasks/${taskId}/tags`,
            newTags.map((id) => ({ tagId: id })),
            { withCredentials: true }
          );
        }
      }
    };

    const taskToUpload = { ...taskInStore };
    taskToUpload.description_to_overlap = taskOverlapDescription;
    delete taskToUpload.filesPathes;
    delete taskToUpload.checkList;
    delete taskToUpload.id;
    taskToUpload.team_id = selectedTeam?.id ? selectedTeam?.id : null;
    taskToUpload.status = props.filterOption;

    if (exposureEnabled) {
      taskToUpload.exposure = exposureEnabled;
    } else {
      taskToUpload.exposure = false;
    }

    if (notRequiredToSubmit) {
      taskToUpload.notRequiredToSubmit = true;
    } else {
      taskToUpload.notRequiredToSubmit = false;
    }

    if (notRequiredToSubmit) {
      taskToUpload.notRequiredToSubmit = true;
    } else {
      taskToUpload.notRequiredToSubmit = false;
    }
    if (notRequiredToCheck) {
      taskToUpload.notRequiredToCheck = true;
    } else {
      taskToUpload.notRequiredToCheck = false;
    }

    const cleanOverlapChecklists = checklistsForOverlap
      .filter((item: any) => item?.todo && typeof item.todo === "string" && item.todo.trim() !== "")
      .map((item: any, index: number) => ({
        todo: item.todo.trim(),
        order_index: index,
      }));

    try {
      setIsLoading(true);
      let savedTaskId: number;

      if (isEditing && taskInStore.id) {
        const taskToUpload2: any = { ...taskToUpload };
        const commonKeys = Object.keys(taskFromDB).filter((key) =>
          Object.keys(taskToUpload2).includes(key)
        );
        const taskFromDBSynced: any = {};
        const taskToUpload2Synced: any = {};
        Object.keys(taskFromDB).forEach((key) => {
          if (commonKeys.includes(key)) {
            taskFromDBSynced[key] = taskFromDB[key];
          }
        });
        taskFromDBSynced["taskGroupId"] = undefined;
        Object.keys(taskToUpload2).forEach((key) => {
          if (commonKeys.includes(key) && typeof taskToUpload2Synced) {
            taskToUpload2Synced[key] = taskToUpload2[key];
          }
        });

        const bool = !isEqual(taskFromDBSynced, taskToUpload2Synced);

        const res = true
          ? await api.put(
            `/tasks/${taskInStore.id}`,
            {
              ...taskToUpload,
              courseBatchId: selectedCourseBatch.id,
            },
            { withCredentials: true }
          )
          : {
            status: 777,
            data: {
              id: taskFromDB.id,
            },
          };
        if (res?.status === 200 || res?.status === 201 || res?.status === 777) {
          savedTaskId = res.data.id ?? res.data.dataValues.id;

          await api.post(
            `/task-checklist-overlap`,
            {
              taskId: savedTaskId,
              checklists: checklistsForOverlap.map((item, index) => ({
                todo: item.todo,
                order_index: index,
              })),
            },
            { withCredentials: true }
          );

          await updateFilesToS3(savedTaskId);
          await handleUploadSolutionFiles(savedTaskId);
          await updateCheckList(savedTaskId, savedTaskId === taskFromDB.id);
          await saveTaskTags(savedTaskId, taskInStore.tags ?? []);
          // שמירת נתוני תזמון

          await saveSchedulingData(savedTaskId);
          queryClient.invalidateQueries({
            queryKey: ["group-tasks"],
          });
          queryClient.invalidateQueries({
            queryKey: ["tasksByGradeStage"],
          });
          queryClient.invalidateQueries({ queryKey: ["surveyDashboard"] });
          setIsLoading(false);
          handleClose();
        }
      } else {
        const res = await api.post(
          `/tasks/${selectedCourseBatch.id}`,
          taskToUpload,
          { withCredentials: true }
        );
        if (res?.status === 200 || res?.status === 201) {
          savedTaskId = res.data.id;

          if (cleanOverlapChecklists.length > 0) {
            await api.post(
              `/task-checklist-overlap`,
              {
                taskId: savedTaskId,
                checklists: cleanOverlapChecklists,
              },
              { withCredentials: true }
            );
          }
          await updateFilesToS3(res.data.id);
          await handleUploadSolutionFiles(res.data.id);
          await uploadCheckList(res.data.id);
          await saveTaskTags(res.data.id, taskInStore.tags ?? []);
          await saveSchedulingData(res.data.id);
          props.onTasksChanged(res.data);

          queryClient.invalidateQueries({
            queryKey: ["group-tasks"],
          });
          queryClient.invalidateQueries({
            queryKey: ["tasksByGradeStage"],
          });
          queryClient.invalidateQueries({ queryKey: ["surveyDashboard"] });
          setIsLoading(false);
          handleClose();
        }
      }
    } catch (error) {
      console.log("Error On Saving Task: ", error);
      setIsLoading(false);
    }
  };

  const handleTaskNameChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value);
    setIsChange(true);
  };

  const handleTaskDesriptionChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => void = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTaskDescription(e.target.value);
    setIsChange(true);
  };
  const handleTaskOverlapDesriptionChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => void = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTaskOverlapDescription(e.target.value);
    setIsChange(true);
  };

  const tasksToAdd: Partial<BoxProps>[] = [
    {
      id: 1,
      name: "צירוף קבצים",
      logo: <PaperClipOutlined rotate={135} style={{ fontSize: "1.5rem" }} />,
      selected: selectedTasks.includes(1) || Boolean(items?.files),
      required: Boolean(items?.files),
      component: (
        <div>
          <p style={{ fontSize: 18 }}>צירוף קבצים :</p>
          <UploadFiles
            locked={props?.locked}
            taskReletedFiles={taskReletedFiles}
            setIsChange={setIsChange}
          />
        </div>
      ),
      fieldInStore: "filesPathes",
      TooltipText: "צרף למשימה קובץ לנחפף",
    },
    {
      id: 10,
      name: "תגובת קובץ",
      logo: (
        <img
          src={eightIcon}
          style={{ width: "1.8rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      required: Boolean(items?.FileResponse),
      selected: selectedTasks.includes(10) || Boolean(items?.FileResponse),
      component: <ResponseFile />,
      fieldInStore: "filesResponse",
      TooltipText: "על החניך להחזיר על המשימה קובץ פתרון",
    },
    {
      id: 11,
      name: "פתרון תרגיל",
      logo: (
        <img
          src={eightIcon}
          style={{ width: "1.8rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(11) || Boolean(items?.SolutionFile),
      required: Boolean(items?.SolutionFile),
      component: (
        <div>
          <p style={{ fontSize: 18 }}>קובץ פתרון למבחן</p>
          <UploadFiles
            taskReletedFiles={taskSolutionFile}
            isSolutionFile={true}
            setIsChange={setIsChange}
          // locked={props?.locked}
          />
        </div>
      ),
      fieldInStore: "solutionFilePathes",
      TooltipText:
        "צרף למשימה קובץ פתרון שיהיה חשוף רק לחופף (חניך לא נחשף לקובץ) ",
    },
    {
      id: 7,
      name: "משוב",
      logo: (
        <img
          src={sevenIcon}
          style={{ width: "2rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(7) || Boolean(items?.feedBack),
      required: Boolean(items?.feedBack),
      component: (
        <Survey
          isFeedback={true}
          form={taskInStore.feedbackId ?? feedbackId}
          setIsChange={setIsChange}
          isSurvey={false}
          locked={props?.locked}
        />
      ),
      fieldInStore: "feedbackId",
      TooltipText:
        " בעת שיבוץ המשימה לחניך יופיע בדאשבורד  'משובים'  תבנית המשוב לחופף למישוב החניך על המשימה ",
    },
    {
      id: 9,
      name: "שאלונים",
      logo: (
        <img
          src={nineIcon}
          style={{ width: "2rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(9) || Boolean(items?.Form),
      required: Boolean(items?.Form),
      component: (
        <Survey
          isFeedback={false}
          form={taskInStore.formId ?? formId}
          isSurvey={false}
          setIsChange={setIsChange}
          locked={props?.locked}
        />
      ),
      fieldInStore: "surveyId",
      TooltipText: "צרף למשימה שאלון ממאגר השאלונים הקיים",
    },
    {
      id: 15,
      name: "סקרים",
      logo: (
        <img
          src={nineIcon}
          style={{ width: "2rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(15) || Boolean(items?.Form),
      required: Boolean(items?.Form),
      component: (
        <Survey
          isFeedback={false}
          form={taskInStore.surveyId ?? surveyId}
          isSurvey={true}
          setIsChange={setIsChange}
        />
      ),
      fieldInStore: "surveyId",
      TooltipText: "צרף למשימה סקר ממאגר הסקרים הקיים",
    },
    {
      id: 2,
      name: "קישור",
      logo: (
        <img
          src={twoIcon}
          style={{ width: "1.4rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(2) || Boolean(items?.link),
      required: Boolean(items?.link),
      component: (
        <StringInput
          locked={props?.locked}
          name="קישור"
          value={linkUrl}
          logos={[
            <img
              src={editIcon}
              style={{ width: "1.2rem", marginTop: ".5vh" }}
              className={style.svgs}
            />,
          ]}
          onChange={(e) => {
            e.target.value?.trim().length > 0
              ? [
                setTaskInStore({
                  ...taskInStore,
                  linkUrl: e.target.value,
                }),
                setLinkUrl(e.target.value),
              ]
              : taskInStore.linkUrl &&
              taskInStore.linkUrl?.trim().length > 0 && [
                setTaskInStore({
                  ...taskInStore,
                  linkUrl: "",
                }),
                setLinkUrl(e.target.value),
              ];
            setIsChange(true);
          }}
        />
      ),
      fieldInStore: "linkUrl",
      TooltipText: "צרף למשימה קישור לנחפף",
    },
    {
      id: 3,
      name: "צ'ק ליסט",
      logo: (
        <img
          src={threeIcon}
          style={{ width: "2.25rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(3) || Boolean(items?.checklist),
      required: Boolean(items?.checklist),
      component: (
        <CheckList
          userRole="admin"
          todos={(taskReletedCheckLists ?? [])
            .filter((t: any) => t?.todo && t.todo.trim() !== "")
            .map((t: any) => t?.todo)}
          setIsChange={setIsChange}
          locked={props?.locked}
        />
      ),
      fieldInStore: "checkList",
      TooltipText: "צרף למשימה רשימת מטלות לנחפף",
    },
    {
      id: 12,
      name: "צבע",
      required: Boolean(items?.color),
      logo: (
        <BgColorsOutlined
          style={{ fontSize: "1.75rem", marginTop: ".5vh", color: "inherit" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(12) || Boolean(items?.color),
      component: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            borderRadius: 8,
            marginTop: 4,
            // gap: 8,
            // padding: "8px 16px",
            // marginBottom: 12,
            // transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "8px 16px",
              // marginBottom: 12,
              borderRadius: 8,
              backgroundColor: isBlockColorEnabled ? "#fff2f0" : "#f6ffed",
              border: `1px solid ${isBlockColorEnabled ? "#ffccc7" : "#b7eb8f"
                }`,
              transition: "all 0.3s ease",
            }}
          >
            {isBlockColorEnabled ? (
              <LockOutlined style={{ color: "#ff4d4f", fontSize: 14 }} />
            ) : (
              <EyeOutlined style={{ color: "#52c41a", fontSize: 14 }} />
            )}
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: isBlockColorEnabled ? "#cf1322" : "#389e0d",
                direction: "rtl",
              }}
            >
              {isBlockColorEnabled
                ? "החניך לא יחשף לצבע שנבחר"
                : "החניך יחשף לצבע שנבחר"}
            </span>
          </div>

          <ColorPicker
            selectedColor={color}
            setColor={setColor}
            setIsChange={setIsChange}
          // locked={props?.locked}
          />
        </div>
      ),
      fieldInStore: "color",
      TooltipText: !isBlockColorEnabled
        ? "צרף למשימה צבע (החניך יהיה חשוף לסעיף הזה)"
        : "צרף למשימה צבע (החניך לא יהיה חשוף לסעיף הזה)",
    },
    {
      id: 5,
      name: "שלב בהסמכה",
      logo: (
        <img
          src={fiveIcon}
          style={{ width: "1.75rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(5) || Boolean(items?.gradeStage),
      required: Boolean(items?.gradeStage),
      component: (
        <GradeStage
          gardeStageInDb={gradeStageId}
          setIsChange={setIsChange}
        // locked={props?.locked}
        />
      ),
      fieldInStore: "gradeStageId",
      TooltipText: "צרף למשימה שלב הסמכה (הנחפף לא יהיה חשוף לסעיף הזה)",
    },
    {
      id: 13,
      name: "תיוגים",
      selected: selectedTasks.includes(13) || Boolean(items?.tags),
      required: Boolean(items?.tags),
      logo: (
        <TagsOutlined
          style={{ fontSize: "1.75rem", marginTop: ".5vh", color: "inherit" }}
          className={style.svgs}
        />
      ),
      component: (
        <EditableTagGroup
          initial={taskTags}
          setIsChange={setIsChange}
        // locked={props?.locked}
        />
      ),
      fieldInStore: "tags",
      TooltipText: "צרף למשימה תיוגים (הנחפף לא יהיה חשוף לסעיף הזה)",
    },

    {
      id: 14,
      name: "תזמון",
      logo: (
        <FieldTimeOutlined
          style={{ fontSize: "1.5rem", marginTop: ".5vh", color: "inherit" }}
          className={style.svgs}
        />
      ),
      selected: schedulingEnabled,
      disabled: selectedTasks.includes(16),
      disabledTooltip: "לא ניתן לבחור - סותר את 'חשיפה'",
      TooltipText:
        "בעת צירוף תזמון למשימה כשהחופף ישבץ את המשימה לחניך המשימה לא תופיע לחניך אלא מהזמנים שהוגדרו בפתיחה ובסגירה ",
      component: (
        <Scheduling
          enabled={schedulingEnabled}
          onEnabledChange={(value) => {
            setSchedulingEnabled(value);
          }}
          startMinutesBefore={startMinutesBefore}
          endMinutesAfter={endMinutesAfter}
          onStartChange={setStartMinutesBefore}
          onEndChange={setEndMinutesAfter}
        // locked={props?.locked}
        />
      ),
    },
    {
      id: 16,
      name: "חשיפה",
      TooltipText:
        "המשימה תוצג לחניך בלוח שנה בעת השיבוץ אבל החניך יוכל להיכנס למשימה רק כשיגיע מועד השיבוץ ",
      logo: (
        <EyeInvisibleOutlined
          style={{ fontSize: "1.5rem", marginTop: ".5vh", color: "inherit" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(16) || Boolean(items?.exposureEnabled),
      disabled: schedulingEnabled,
      disabledTooltip: "לא ניתן לבחור - סותר את 'תזמון'",
      component: (
        <div className={style.exposureWrapper}>
          <div className={style.exposureContent}>
            <div className={style.exposureDescription}>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                הפעלת חשיפה
              </p>
              <p style={{ fontSize: 14, color: "#6b7280" }}>
                כאשר החשיפה מופעלת, המשימה תוצג לחניך (נעולה) לפני ואחרי זמן
                השיבוץ, אך לא יוכל לפתוח אותה,
                <br />
                החניך יוכל להיכנס למשימה רק בזמן שהמשימה שובצה לו.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      name: "חובת הגשה",
      logo: (
        <img
          src={sixIcon}
          style={{ width: "2rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(6) || Boolean(items?.duration),
      disabled: selectedTasks.includes(17) || notRequiredToSubmit,
      disabledTooltip: "לא ניתן לבחור - סותר את 'לא נדרש להגשה'",
      required: Boolean(items?.duration),
      component: (
        <>
          <RecommendedTime
            key={`recommended-time-${recommendedTime}`}
            recommendedTime={recommendedTime}
            setIsChange={setIsChange}
          />
        </>
      ),
      fieldInStore: "recommendedTime",
      TooltipText:
        "משימה זו מחייבת תאריך הגשה. בעת שיבוץ המשימה יוגדר מועד ההגשה, כאשר משך הזמן המוצג הוא הברירת מחדל. במועד ההגשה יופיע לחניך כפתור 'הגש' ",
    },
    {
      id: 17,
      name: "לא נדרש להגשה",
      logo: (
        <CheckCircleOutlined
          style={{ fontSize: "1.5rem", marginTop: ".5vh", color: "inherit" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(17) || notRequiredToSubmit,
      disabled: selectedTasks.includes(6) || Boolean(items?.duration),
      disabledTooltip: "לא ניתן לבחור - סותר את 'חובת הגשה'",
      component: (
        <div className={style.notRequiredWrapper}>
          <div className={style.notRequiredContent}>
            <div className={style.notRequiredDescription}>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                המשימה לא נדרשת להגשה
              </p>
              <p style={{ fontSize: 14, color: "#6b7280" }}>
                כאשר אפשרות זו מופעלת, המשימה תוצג לחניך בלוח השנה, אך לא יידרש
                ממנו להגיש דוח והחופף לא יידרש לאשר.
                <br />
                המשימה תסומן כ"הושלמה" אוטומטית.
              </p>
            </div>
          </div>
        </div>
      ),
      TooltipText: "המשימה תופיע לחניך אך ללא דרישת הגשה או אישור חופף",
    },
    {
      id: 18,
      name: "לא נדרש בדיקה",
      logo: (
        <AuditOutlined
          style={{ fontSize: "1.5rem", marginTop: ".5vh", color: "inherit" }}
          className={style.svgs}
        />
      ),
      selected: selectedTasks.includes(18) || notRequiredToCheck,
      component: (
        <div className={style.notRequiredWrapper}>
          <div className={style.notRequiredContent}>
            <div className={style.notRequiredDescription}>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                המשימה לא נדרשת לבדיקה
              </p>
              <p style={{ fontSize: 14, color: "#6b7280" }}>
                כאשר אפשרות זו מופעלת, המשימה לא תופיע במסך 'חופפים' והחופף לא יידרש לבדוק אותה.
                <br />
                המשימה תסומן כמבוצעת ללא אישור חופף.
              </p>
            </div>
          </div>
        </div>
      ),
      TooltipText:
        "במידה ואין צורך בבדיקת המשימה על ידי חופף, סמן אופציה זו. המשימה לא תופיע במסך חופפים",
    },
  ];

  return (
    <div style={{ width: "100%", direction: "ltr" }}>
      <Modal
        open={props.openModal}
        width={"70vw"}
        className={style.modal}
        onCancel={() => {
          if (isChange && !props?.locked) {
            Modal.confirm({
              title: "יש שינויים שלא נשמרו",
              content: "האם אתה בטוח שברצונך לסגור?",
              okText: "סגור",
              cancelText: "ביטול",
              style: { direction: "rtl" },
              onOk: () => handleClose(),
            });
          } else {
            handleClose();
          }
        }}
        footer={
          <>
            <div className={style.headerDiv}>
              {selectedPermission?.role_code !== "STUDENT" && (
                <div className={style["imporveDiv"]}>
                  <div
                    onClick={() => setMode("train")}
                    className={style["imporveText"]}
                    style={{
                      backgroundColor: mode === "train" ? "white" : "",
                      color: mode !== "train" ? "white" : "",
                    }}
                  >
                    חופף
                  </div>
                  <div
                    onClick={() => setMode("soldier")}
                    className={style["imporveText"]}
                    style={{
                      backgroundColor: mode === "soldier" ? "white" : "",
                      color: mode !== "soldier" ? "white" : "",
                    }}
                  >
                    נחפף
                  </div>
                </div>
              )}
              {/* {props?.locked && mode === "soldier" && (
                <div className={style.lockedMessage}>
                  <span>
                    * לא ניתן לערוך משימה זו מכיוון שהיא כבר שובצה לחניכים
                  </span>
                </div>
              )} */}
              {/* !props?.locked && */}
              {isChange || (props?.locked && isChange && mode === "train") ? (
                <div className={style.saveTaskWrapBtn}>
                  <BlackButton
                    textColor="black"
                    BGcolor="white"
                    width="3.5vw"
                    height="3vh"
                    onclickProps={handleClose}
                  >
                    ביטול
                  </BlackButton>
                  <BlackButton
                    width="3.5vw"
                    height="3vh"
                    onclickProps={handleSave}
                  >
                    {isEditing ? "עדכון" : "שמירה"}
                  </BlackButton>
                </div>
              ) : props?.locked &&
                !isChange &&
                mode === "soldier" ? null : null}{" "}
            </div>
          </>
        }
      >
        <div
          className={style.soldierModeContent}
          style={{ display: mode === "train" ? "block" : "none" }}
        >
          <h1>תרגום מילולי</h1>
          <div className={style.notesDiv}>
            <h3>הערת תרגיל</h3>
            <Input.TextArea
              name={"מלל חופשי "}
              placeholder={"מלל חופשי "}
              value={taskOverlapDescription}
              autoSize={{ minRows: 1, maxRows: 7 }}
              onChange={handleTaskOverlapDesriptionChange}
              style={{
                width: "80%",
                padding: "0.6rem 0.5rem",
                borderRadius: "20px",
                border: "none",
                background: "#f4f1eb",
              }}
              status={taskOverlapDescription.length > 500 ? "error" : ""}
              allowClear={true}
            />
            <CheckListForOverlap
              width="38vw"
              initialItems={checklistsForOverlap}
              onItemsChange={setChecklistsForOverlap}
              setIsChange={setIsChange}
            />
          </div>
        </div>

        <div
          className={style.modal_mission_view}
          style={{ display: mode === "soldier" ? "flex" : "none" }}
        >
          <div>
            <div className={style.add_parts}>
              {tasksToAdd.map((element) => (
                <AddTaskBox
                  key={element.name}
                  id={element.id ?? 0}
                  name={element.name ?? ""}
                  logo={element.logo ?? <div></div>}
                  selected={element.selected ?? false}
                  disabled={element.disabled}
                  disabledTooltip={element.disabledTooltip}
                  fieldInStore={element.fieldInStore}
                  handleClick={HandleTaskBoxClick}
                  required={element.required}
                  locked={
                    props?.locked && !allowToEdit.includes(element.name ?? "")
                  }
                  TooltipText={element.TooltipText}
                />
              ))}
            </div>

            {props.editingTask &&
              activeHeaderType != "domain" &&
              activeHeaderType != "courseBatches" &&
              activeHeaderType != "course" && (
                <div className={style.CastingAssignments}>
                  <CastingAssignments missionId={props.editingTask?.id} />
                </div>
              )}
          </div>
          <div className={style.inputs_wrapper}>
            <div className={style.logo_and_header}>
              <div className={style.inputs_wrapper_header}>
                <div className={style.mission_group_header}>
                  {props?.taskGroupTitle}
                </div>

                <div className={style.mission_name_header}>
                  {taskName?.length > 0 ? (
                    <span style={{ color: "black" }}>{taskName}</span>
                  ) : (
                    <span style={{ color: "gray" }}>שם המשימה</span>
                  )}
                </div>
              </div>
            </div>
            <div className={style.inputs_list}>
              <div className={style.inputs_header}>
                {isEditing ? "עריכת משימה" : "יצירת משימה"}
                <div style={{ paddingRight: "15px" }}>
                  <Tooltip title="צפה בתצוגה מקדימה">
                    <Button
                      size="large"
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={handleOpenPreview}
                      disabled={!taskName.trim() || !taskDescription.trim()}
                    >
                      תצוגה מקדימה
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <div className={style.inputs} data-testid="inputs">
                <StringInput
                  name={"שם משימה"}
                  value={taskName}
                  logos={[
                    <img
                      src={editIcon}
                      style={{ width: "1.2rem", marginTop: ".5vh" }}
                      className={style.svgs}
                    />,
                  ]}
                  onChange={handleTaskNameChange}
                  locked={props?.locked}
                />

                <div style={{ position: "relative", width: "35vw" }}>
                  <Input.TextArea
                    name={"תיאור משימה"}
                    placeholder={"תיאור משימה"}
                    value={taskDescription}
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    onChange={handleTaskDesriptionChange}
                    // disabled={props?.locked}
                    style={{
                      padding: "0.6rem 0.5rem",
                      borderRadius: "20px",
                      border: "none",
                    }}
                    status={taskDescription.length > 500 ? "error" : ""}
                    allowClear={true}
                  />
                </div>
                {tasksToAdd
                  ?.filter((box) => box.selected && box.component)
                  ?.map((box) => (
                    <React.Fragment key={box.id}>
                      {box.component}
                    </React.Fragment>
                  ))}
              </div>
            </div>
          </div>
        </div>
        {isLoading && (
          <div className={style.loading}>
            <Spin
              size="large"
              children={
                <div
                  style={{
                    zIndex: 1002,
                    marginTop: "10vh",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                  }}
                >
                  מעלה נתונים...
                </div>
              }
            />
          </div>
        )}
      </Modal>
      {previewTask && (
        <UserTaskModal
          // taskId={u}
          task={previewTask}
          openModal={openUserTaskModal}
          setOpenModal={setOpenUserTaskModal}
          setSelectedEvent={setOpenUserTaskModal}
          completed_at={previewTask.completed_at}
          onRefresh={() => { }}
          isPreview={true}
        />
      )}
    </div>
  );
};

export default NewTaskModal;
