import React, { useEffect, useMemo, useRef, useState } from "react";
import style from "../UserTaskModal/UserTaskModal.module.css";
import { Modal, Button, Tag, Tooltip } from "antd";
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
  PaperClipOutlined,
} from "@ant-design/icons";
import twoIcon from "../../media/svg/solarlink-outline.svg";
import eightIcon from "../../media/svg/healthiconsi-exam-qualification-outline.svg";
import { useFetchFilesByTaskId } from "../../hooks/useFetchFilesByTaskId";
import { useTaskById } from "../../hooks/useGetTaskById";
import "react-h5-audio-player/lib/styles.css";
import ReactPlayer from "react-player";
import CheckList from "../NewTaskModal/Inputs/CheckList/CheckList";
import UploadFiles from "../NewTaskModal/Inputs/UploadFiles/UploadFiles";
import { useNavigate } from "react-router-dom";

import { useFetchCheckListsByTaskId } from "../../hooks/useFetchCheckListsByTaskId";
import { queryClient } from "../../api/queryClient";
import WaveSurferComponent from "../UserTaskModal/Audio/WaveSurfer";
import { usePermissionStore } from "../../store/permissionStore";
import { useFetchTagsByTaskId } from "../../hooks/useFetchTagsByTaskId";

export type UserTaskModalProps = {
  taskId?: number;
  task?: Task;
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
};

type Mission = {
  id: number;
  progress_type: string;
  completed_at: Date | null;
};
const TeamTaskModal = (props: UserTaskModalProps) => {
  const [taskReletedFiles, setTaskReletedFiles] = useState<any[]>([]);
  const [patbassFile, setPatbassFile] = useState<any>(null);
  const [responseFiles, setResponseFiles] = useState<any[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<any[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean[]>([]);
  const [checkLists, setCheckList] = useState<any>([]);
  const taskInStore = useTaskStore((state) => state.task);
  const checklistsData = useFetchCheckListsByTaskId(props.taskId);
  const { data: task, isLoading, isError } = useTaskById(props.taskId);
  const taskAssId = props.task?.task_assignment_id; // peut être null
  const navigate = useNavigate();
  const data = useFetchFilesByTaskId(props?.taskId);

  const selectedPermission = usePermissionStore(
    (s) => s.selectedPermission?.role_code
  );
  const tagsData = useFetchTagsByTaskId(props?.taskId);
  const handleClose: () => void = () => props.setOpenModal(false);
  const handleDownload = async (url: string, fileName: string) => {
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
    } finally {
    }
  };
  const uploadFiles = async (taskId: number | string, files: File[]) => {
    if (taskInStore?.filesPathes!.length > 0 && files[0]) {
      const prevFiles = taskInStore.filesPathes
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

      await updateFiles([files[0]], taskId, prevFiles, false, true, taskAssId);
    } else {
      await uploadFilesToS3(
        [files[0]],
        Number(taskId),
        null,
        false,
        true,
        taskAssId
      );
    }
  };

  const getFilePreview = (file: any) => {
    const fileName = file?.name || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const fileUrl = `${process.env.REACT_APP_S3_BASE_URL}/${file?.s3BucketName}/${file?.s3Key}`;

    // 1. IMAGE (png, jpg, jpeg, gif, webp)
    if (file.type?.includes("image")) {
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
              }}
            />
          </div>
        </div>
      );
    }

    // 2. WORD / EXCEL / PPT / TXT (Documents)
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
      "msg"
    ];
    if (docExtensions.includes(extension)) {
      let iconColor = "#2b5d8a"; // Bleu par défaut
      let iconType = "FileTextOutlined";

      // Distinct color for Word, Excel, PPT
      if (extension.includes("xls")) iconColor = "#217346"; // green
      if (extension.includes("ppt")) iconColor = "#d24726"; // Orange PPT
      if (extension.includes("pdf")) iconColor = "#b30b00"; // red PDF

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
            />
          </div>
        </div>
      );
    }

    // 3. AUDIO (wav, mp3)
    if (file.type?.includes("audio") || file.type?.includes("octet-stream")) {
      return (
        <div
          style={{
            marginBottom: "15px",
            background: "#f0f2f5",
            padding: "15px",
            borderRadius: "10px",
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
    // 4. VIDEO
    if (file.type?.includes("video")) {
      return (
        <div
          style={{
            marginBottom: "10px",
            width: "100%",
            background: "#000",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <ReactPlayer
            url={fileUrl}
            width="100%"
            height="100%"
            controls={true}
            light={false}
            style={{ aspectRatio: "16/9" }}
          />
        </div>
      );
    }

    // 5. DEFAULT (Fallback)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "5px",
        }}
      >
        <FileJpgOutlined style={{ fontSize: "1.5rem" }} />
        <span>{fileName}</span>
        <Button
          icon={<DownloadOutlined />}
          href={fileUrl}
          download={fileName}
          size="small"
        />
      </div>
    );
  };

  const hasFiles = taskReletedFiles && taskReletedFiles.length > 0;
  const hasCheckLists = checkLists && checkLists.length > 0;
  const hasLink = task?.linkUrl;
  const hasForm = task?.formId;
  const hasFilesResponse = task?.filesResponse;

  const contentToDisplay = useMemo(() => {
    const contents: Array<{ type: string; index: number }> = [];
    let index = 0;

    if (hasFiles) {
      contents.push({ type: "file", index: index++ });
    }
    if (hasLink) {
      contents.push({ type: "link", index: index++ });
    }
    if (hasCheckLists) {
      contents.push({ type: "checklist", index: index++ });
    }
    if (hasForm) {
      contents.push({ type: "form", index: index++ });
    }
    if (hasFilesResponse) {
      contents.push({ type: "filesResponse", index: index++ });
    }

    return contents;
  }, [hasFiles, hasCheckLists, hasLink, hasForm, hasFilesResponse]);

  useEffect(() => {
    if (data?.data) {
      setTaskReletedFiles(
        data.data.filter((file: any) => !file.isPatbass && !file.isFileResponse)
      );
      setPatbassFile(
        data.data.find((file: any) => file.isPatbass && !file.isFileResponse)
      );
      const filesUpload = data.data.filter(
        (f: any) => f.isFileResponse && f.task_assignment_id === taskAssId
      );
      setFilesToUpload(filesUpload);

      const responseFilesList = data.data.filter(
        (f: any) => f.isFileResponse && f.task_assignment_id === taskAssId
      );
      setResponseFiles(responseFilesList);
    }
  }, [data?.data, taskAssId]);

  useEffect(() => {
    if (checklistsData?.data) {
      setCheckList(checklistsData.data);
    }
  }, [checklistsData?.data]);

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
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <div className={style.task_group_name}>{props.task?.gn}</div>
              <div>
                {selectedPermission !== "STUDENT" &&
                  tagsData?.data?.tags?.map((tag: any) => (
                    <Tag>{tag.tagName}</Tag>
                  ))}
              </div>
            </div>
            <div className={style.task_name}>{task?.name} </div>

            <div className={style.task_descripation}>{task?.description}</div>
            <div className={style.relevant_missions}>
              {hasFiles && (
                <div className={style.files_content}>
                  {taskReletedFiles?.map((file, idx) => (
                    <div key={file.id || idx}>{getFilePreview(file)}</div>
                  ))}
                </div>
              )}

              {hasLink && (
                <div className={style.link_content}>
                  <div className={style.fileContainer}>
                    <div className={style.input_wrapper}>
                      <a
                        href={task?.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(task?.linkUrl, "_blank");
                        }}
                      >
                        {task?.linkUrl}
                      </a>
                      <img src={twoIcon} style={{ width: "1.2rem" }} />
                    </div>
                    {taskAssId &&
                      isCompleted[
                        contentToDisplay.findIndex((c) => c.type === "link")
                      ] && (
                        <div className={style.completed_icon}>
                          <CheckCircleOutlined
                            style={{ color: "green", fontSize: 30 }}
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {hasCheckLists && (
                <div className={style.files_content}>
                  <div className={style.fileContainer}>
                    <div style={{ direction: "rtl", width: "36.1vw" }}>
                      <CheckList
                        checkLists={checkLists}
                        userRole="admin"
                        todos={checkLists?.map((t: any) => ({
                          todo: t?.todo,
                          completed_at: t.completed_at,
                          id: t.id,
                        }))}
                        width="100%"
                        lock={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form/Survey */}
              {hasForm && (
                <div className={style.form_content}>
                  <div className={style.fileContainer}>
                    <div
                      onClick={() => {
                        if (taskAssId) {
                          navigate(`/forms/answer/${taskAssId}`);
                        } else {
                          // if not taskAssId, navigate to edit form
                          navigate(`/forms/edit/${task?.formId}`);
                        }
                      }}
                      className={style.input_wrapper}
                    >
                      <div>{task?.parentForm?.title}</div>
                      <img src={eightIcon} style={{ width: "1.5rem" }} />
                    </div>
                  </div>
                </div>
              )}
              {/* 
             
              {hasFilesResponse && selectedPermission === "STUDENT" && (
                <div className={style.files_response_content}>
                  <UploadFiles
                    taskId={props.taskId}
                    taskReletedFiles={filesToUpload}
                    onFileUploaded={async (files) => {
                      uploadFiles(Number(props.taskId), files);
                    }}
                    width={34}
                  />
                </div>
              )} */}

              {/* Patbass */}
              {patbassFile && selectedPermission !== "STUDENT" && (
                <div>
                  <div className={style.divider}>
                    <span>פתב"ס</span>
                  </div>
                  <div className={style.files_content}>
                    {getFilePreview(patbassFile)}
                  </div>
                </div>
              )}

              {/* Response Files (Admin view) */}
              {selectedPermission !== "STUDENT" &&
                responseFiles &&
                responseFiles.length > 0 && (
                  <div className={style.files_content}>
                    <h1>קבצים שהחייל העלה</h1>
                    {responseFiles.map((file, i) => (
                      <div key={file.id || i}>{getFilePreview(file)}</div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeamTaskModal;
