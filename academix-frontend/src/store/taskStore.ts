import api from "../api/axios";
import { notification } from "antd";
import { sha256 } from "js-sha256";
import { create } from "zustand";
import { getAudioDurationFromFile } from "../utils/getFileLength";
import { isEqual } from "es-toolkit/compat";

export type Survey = {};

export interface Task {
  id?: number | string | null;
  name: string;
  description: string;
  description_to_overlap?: string;
  hidden: boolean;
  status: "operational" | "assignment_bank" | "archives";
  taskGroupId: string | number;
  creatorId: string | number;
  estimatedMinutes: number;
  submissionRequired?: boolean;
  chatId?: string | number | null;
  feedbackId?: string | number | null;
  Feedback?: any;
  formId?: string | number | null;
  surveyId?: string | number | null;
  feedbacks?: string | number | null;
  linkUrl?: string | null;
  filesPathes?: File[] | string[] | number[] | null;
  solutionFilePathes?: File[] | string[] | number[] | null;
  filesResponse?: File[] | string[] | number[] | boolean | null;
  gradeStageId?: number | string | null;
  recommendedTime?: number | null;
  checkList?: { toDo: string; done: boolean }[] | null | any;
  task_assignment_id?: number;
  exposure?: boolean;
  parentForm?: { title: string; id: number } | null;
  survey?: { title: string; id: number } | null;
  // שדות שנוספו ל-event:
  title?: string;
  date?: string;
  end?: string;
  color?: string;
  tags?: any[];
  taskid?: number;
  taskDescription?: string;
  stage?: string;
  gn?: string;
  assignedHour?: string;
  assignedMinutes?: number;
  assignedcount?: number;
  totalmembers?: number;
  formSubmissions?: Array<string> | any;
  completed_at?: string | Date;
  completionrate?: number;
  completed_tm_ids?: Array<string>;
  completed_only_tm_ids?: Array<string>;
  completed_at_only_tm_ids?: Array<string>;
  completed_all_tm_ids?: Array<string>;
  solution_file_id?: number;
  team_id?: number | null;
  form_completed_at?: string;
  form_score?: string;
  notRequiredToSubmit?: boolean;
  notRequiredToCheck?: boolean | null;
}

interface TaskStoreState {
  task: Task;
  addTask: (task: Task) => void;
  updateTask: (updates: Partial<Task>) => void;
}

export const calculateSHA256 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return sha256(bytes);
};

export const deleteFilesByFeedbackId = async (
  feedback_answer_id: number | null
): Promise<void> => {
  if (feedback_answer_id === null) return; // אין מה למחוק

  await api.delete(
    `/files/by-feedback`,
    {
      data: { feedback_answer_id }, // שליחה ב‑body של DELETE
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const uploadFilesToS3 = async (
  files: File[],
  taskId: number | null,
  feedback_answer_id: number | null,
  isSolutionFile: boolean = false,
  isFileResponse?: boolean,
  taskAssId?: number,
  form_question_id?: number | string | null // ← nouveau param
) => {
  if (files.length === 0) {
    notification.error({
      key: `key-${new Date()}`,
      message: "לא נבחרו קבצים",
      duration: 3,
    });
    return;
  }
  console.log("filesss", files);

  const uploadPromises = files.map(async (file) => {
    // const requestOptions = {
    //   headers: {
    //     "Content-Type": "multipart/form-data",
    //   },
    // };

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileHash = calculateSHA256(arrayBuffer);
      let fileLength: number | null = null;
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
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
        "png",
        "jpeg",
        "jpg",
        "msg",
      ];
      try {
        if (!docExtensions.includes(extension)) {
          fileLength = await getAudioDurationFromFile(file);
        }
      } catch (error) {
        console.warn(`שגיאה בקבלת אורך הקובץ ${file.name}:`, error);
      }

      const formData = new FormData();

      if (isFileResponse) {
        formData.append("isFileResponse", String(isFileResponse ?? true));
      }
      if (taskAssId) {
        formData.append("task_assignment_id", String(taskAssId));
      }

      if (form_question_id) {
        formData.append("form_question_id", String(form_question_id));
      }
      formData.append("file", file);

      formData.append("originalFilename", file.name);
      formData.append("bucket", "academix");
      formData.append("taskId", String(taskId));
      formData.append("feedback_answer_id", String(feedback_answer_id));
      formData.append("isPatbass", isSolutionFile.toString());

      fileLength &&
        fileLength !== null &&
        formData.append("fileLength", String(fileLength));
      formData.append("key", fileHash);

      const red = await api.post(
        `/files/upload-file`,
        formData
        // requestOptions
      );

      return red;
    } catch (error) {
      console.error(`שגיאה בהעלאת ${file.name}:`, error);
    }
  });

  return await Promise.all(uploadPromises);
};

export const updateFiles = async (
  files: any[],
  taskId: number | string | null,
  prevFiles: any[],
  isSolutionFile: boolean = false,
  isFileResponse?: boolean,
  taskAssId?: number,
  formFeedback?: boolean,
  feedback_answer_id?: number | null
) => {
  if (files?.length === 0 && prevFiles?.length > 0) {
    await api.delete(
      `/files/deleteAllFilesByTaskId`,
      {
        headers: {
          taskid: taskId,
          ispatbass: isSolutionFile ? "true" : "false",
        },
      }
    );
  } else {
    const existInDBFiles = files?.filter((i) => !(i instanceof File) && i?.id);
    const filesToUpload = files?.filter((i) => i instanceof File);
    // Find files to delete: files that exist in prevFiles but not in existInDBFiles
    const filesToDelete = prevFiles?.filter((prevFile) => {
      return (
        !existInDBFiles?.some((dbFile) => dbFile.id === prevFile.id) &&
        prevFile.task_id == taskId
      );
    });

    if (filesToUpload?.length > 0) {
      if (isFileResponse && taskAssId) {
        await uploadFilesToS3(
          filesToUpload,
          taskId ? Number(taskId) : null,
          null,
          isSolutionFile,
          true,
          taskAssId
        );
      } else {
        if (formFeedback && feedback_answer_id) {
          await uploadFilesToS3(
            filesToUpload,
            taskId ? Number(taskId) : null,
            feedback_answer_id,
            isSolutionFile
          );
        } else {
          await uploadFilesToS3(
            filesToUpload,
            taskId ? Number(taskId) : null,
            null,
            isSolutionFile
          );
        }
      }
    }
    if (filesToDelete?.length > 0) {
      const ids = filesToDelete?.map((v) => v?.id);
      await deleteFiles(ids);
    }
  }
};

export const deleteFiles = async (ids: (string | number)[]) => {
  if (ids.length === 0) {
    notification.error({
      key: `key-${new Date()}`,
      message: "לא נבחרו קבצים",
      duration: 3,
    });
    return;
  }

  const deletePromises = ids.map(async (id) => {
    // i remove file and i have error
    try {
      await api.delete(
        `/files/delete-file`,
        { headers: { id: id } }
      );
    } catch (error) {
      console.error(`שגיאה במחיקת ${id}:`, error);
    }
  });

  await Promise.all(deletePromises);
};

export const uploadCheckListToDB = async (
  checkList: { toDo: string; done: boolean }[] | null | undefined,
  taskId: number | string
) => {
  if (checkList && checkList.length === 0) {
    notification.error({
      key: `key-${new Date()}`,
      message: "לא נבחרו רשומות",
      duration: 3,
    });
    return;
  }

  for (const item of checkList!!) {
    try {
      await api.post(
        `/checklists/create`,
        { taskid: taskId, todo: item.toDo },
        { withCredentials: true }
      );
    } catch (error) {
      console.error(`שגיאה בהעלאת ${item.toDo}:`, error);
    }
  }
};

export const updateCheckListToDB = async (
  checkList: { toDo: string; done: boolean }[] | null | undefined | any,
  taskId: number | string,
  prevCL: { todo: string; done: boolean }[],
  newCl: boolean
) => {
  const strings1 = checkList?.map((i: any) => i?.toDo);
  const strings2 = prevCL?.map((i: any) => i?.todo);

  if (isEqual(strings1, strings2) && newCl) {
    return;
  }
  try {
    await api.put(
      `/checklists/update`,
      { checkList, taskId },
      { withCredentials: true }
    );
  } catch (error) {
    console.error(`שגיאה בהעלאת ${checkList}:`, error);
  }
};

export const useTaskStore = create<TaskStoreState>((set) => ({
  task: {
    id: null,
    name: "",
    description: "",
    // taskOverlapDescription: "",
    hidden: false,
    status: "operational",
    taskGroupId: "",
    estimatedMinutes: 0,
    creatorId: "",
    filesResponse: false,
    exposure: false,
    notRequiredToCheck: false,
  },
  addTask: (task) => {
    return set({ task });
  },
  updateTask: (updates) =>
    set((state) => ({
      task: { ...state.task, ...updates },
    })),
}));
