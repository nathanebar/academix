import React, { useState, useRef, useEffect } from "react";
import style from "./UploadFiles.module.css";
import {
  deleteFiles,
  updateFiles,
  useTaskStore,
} from "../../../../store/taskStore";
import {
  CloseOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { Button, notification, Popover, Tooltip } from "antd";
import chooseIcon from "../../../../media/svg/choose_file.svg";
import dragIcon from "../../../../media/svg/drag_file.svg";
import { improveText } from "../../TaskMiniBox/TaskMiniBox";

type Props = {
  onFileUploaded?: (files: File[]) => void; // Optional callback
  taskId?: number;
  taskReletedFiles?: any;
  width?: number;
  isSolutionFile?: boolean;
  setIsChange?: any;
  locked?: boolean | undefined;
  isPreview?:boolean;

};
type FilesWithIds = (File & { id?: string })[];

const UploadFiles = ({
  onFileUploaded,
  taskId,
  taskReletedFiles,
  width,
  isSolutionFile,
  setIsChange,
  locked,
  isPreview
}: Props) => {
  const taskInStore = useTaskStore((state) => state.task);
  const setTaskInStore = useTaskStore((state) => state.updateTask);
  const [files, setFiles] = useState<FilesWithIds>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ======== סוגי קבצים מותרים ========
  const ALLOWED_TYPES = [
    "pdf",
    "doc",
    "docx",
    "jpg",
    "jpeg",
    "png",
    "mp3",
    "mp4",
    "msg",
  ];

  const isAllowedFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return ALLOWED_TYPES.includes(ext) || file.type.length > 0;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if(isPreview) return;
    e.preventDefault();
  };
  useEffect(() => {
    setFiles(taskReletedFiles);
  }, [taskReletedFiles]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files || []);
    if (newFiles.length === 0) return;

    const invalidFiles = newFiles.filter((f) => !isAllowedFile(f));
    const validFiles = newFiles.filter((f) => isAllowedFile(f));

    if (invalidFiles.length > 0) {
      const problematicFilesNames = invalidFiles.map((f) => `${f.name}, `);

      notification.error({
        key: `key-${Date.now()}`,
        message: "קבצים בעייתיים נמצאו",
        description: (
          <div>
            <div>הקבצים הבאים לא ניתנים לעיבוד:</div>
            <div className="problematic-files">{problematicFilesNames}</div>
            <div className="contact-team">
              אנא צרו קשר עם צוות הפיתוח לבדיקה
            </div>
          </div>
        ),
        duration: 25,
        className: "hebrew-notification-custom",
        style: {
          direction: "rtl",
          marginRight: "10px",
        },
        placement: "topRight",
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) =>
        prev?.length > 0 ? [...prev, ...validFiles] : [...validFiles]
      );

      notification.success({
        key: `key-${Date.now()}`,
        message: `הועלו בהצלחה ${validFiles.length} קבצים`,
        duration: 3,
        style: { direction: "rtl" },
      });

      if (onFileUploaded) {
        onFileUploaded(validFiles);
      }
    }
    if (wwwref.current) {
      wwwref.current.style.backgroundColor = "white";
    }
  };
  const notificationStyle = document.createElement("style");
  notificationStyle.textContent = `
    .hebrew-notification-custom .ant-notification-notice-content {
      direction: rtl;
      text-align: right;
      padding: 16px 20px;
      border-radius: 8px;
      background: linear-gradient(135deg, #fff2f0 0%, #fff7e6 100%);
      border-right: 4px solid #ff4d4f;
      box-shadow: 0 4px 12px rgba(255, 77, 79, 0.15);
    }
    
    .hebrew-notification-custom .ant-notification-notice-message {
      font-size: 16px;
      font-weight: 600;
      color: #cf1322;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .hebrew-notification-custom .ant-notification-notice-message::before {
      content: '⚠️';
      font-size: 20px;
    }
    
    .hebrew-notification-custom .ant-notification-notice-description {
      color: #434343;
      font-size: 14px;
    }
    
    .hebrew-notification-custom .problematic-files {
      background: #fff;
      border: 1px solid #ffccc7;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 8px 0;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #a8071a;
      max-height: 100px;
      overflow-y: auto;
    }
    
    .hebrew-notification-custom .contact-team {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed #ffd8bf;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #d46b08;
    }
    
    .hebrew-notification-custom .contact-team::before {
      content: '📧';
    }
  `;
  document.head.appendChild(notificationStyle);
 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    const invalidFiles = newFiles.filter((f) => !isAllowedFile(f));
    const validFiles = newFiles.filter((f) => isAllowedFile(f));

    if (invalidFiles.length > 0) {
      const problematicFilesNames = invalidFiles.map((f) => `${f.name}, `);

      notification.error({
        key: `key-${Date.now()}`,
        message: "קבצים בעייתיים נמצאו",
        description: (
          <div>
            <div>הקבצים הבאים לא ניתנים לעיבוד:</div>
            <div className="problematic-files">{problematicFilesNames}</div>
            <div className="contact-team">אנא צרו קשר עם צוות הפיתוח לבדיקה</div>
          </div>
        ),
        duration: 25,
        className: "hebrew-notification-custom",
        style: { direction: "rtl", marginRight: "10px" },
        placement: "topRight",
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) =>
        prev?.length > 0 ? [...prev, ...validFiles] : [...validFiles]
      );

      notification.success({
        key: `key-${Date.now()}`,
        message: `הועלו בהצלחה ${validFiles.length} קבצים`,
        duration: 3,
        style: { direction: "rtl" },
      });

      if (onFileUploaded) {
        onFileUploaded(validFiles);
      }
    }

    // כדי לאפשר בחירה חוזרת של אותו קובץ
    if (e.target) {
      e.target.value = "";
    }
};

  const triggerFileInput = () => {
    if(isPreview)return
    fileInputRef?.current?.click();
  };

  const removeFile = async (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (onFileUploaded) {
      const id = files.find((_, i) => i === index)?.id;

      if (id)
        // await updateFiles([], Number(taskId),files.filter((_, i) => i !== index),true)
        deleteFiles([id]);
    }
    // setIsChange(true);
  };
  const handleDownload = async (file: any) => {
    const fileName = file?.name || "";
    const fileUrl = `${process.env.REACT_APP_S3_BASE_URL}/${file?.s3BucketName}/${file?.s3Key}`;

    try {
      const response = await fetch(fileUrl);
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
  useEffect(() => {
    if (isSolutionFile) {
      setTaskInStore({ ...taskInStore, solutionFilePathes: files });
    } else {
      setTaskInStore({ ...taskInStore, filesPathes: files });
    }
  }, [files]);

  const wwwref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);

  window.addEventListener("dragover", (e) => {
    if (wwwref.current) {
      wwwref.current.style.backgroundColor = "#d1d1d1ff";
    }
  });

  window.addEventListener("dragleave", (e) => {
    e.preventDefault();
    if (wwwref.current) {
      wwwref.current.style.backgroundColor = "white";
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (wwwref.current) {
      wwwref.current.style.backgroundColor = "white";
    }
  });

  return (
    <div
      className={style.wrapper}
      style={{ width: width ? `${width}vw` : "33vw" }}
    >
      <div className={style.rightSide}>
        {/* <div className={style.text}>קובץ</div> */}
        <Button
          className={style.dropArea}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          shape="round"
          size="middle"
          ref={wwwref}
          disabled={locked}
        >
          <p className={style.text}>גרור קבצים</p>
          <img
            src={dragIcon}
            style={{ width: "1.4rem", marginTop: ".5vh" }}
            className={style.svgs}
          />
        </Button>
        <Button
          shape="round"
          size="middle"
          className={style.clickArea}
          onClick={triggerFileInput}
          disabled={locked}
        >
          <p className={style.text}>בחר קבצים</p>
          <img
            src={chooseIcon}
            style={{ width: "1.4rem", marginTop: ".5vh" }}
            className={style.svgs}
          />
        </Button>
      </div>
      {files?.length > 0 && (
        <Popover
          trigger="hover"
          placement="bottom"
          content={
            <div className={style.fileList}>
              <h3>קבצים שנבחרו ({files?.length}) :</h3>
              {files.map((file, index) => (
                <div
                  key={index}
                  className={style.fileItem}
                  onClick={() => handleDownload(file)}
                >
                  <span>{improveText(file.name, 40)}</span>
                  <Tooltip color="gray" title="הסרת קובץ">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      shape="circle"
                      size="small"
                      style={{ backgroundColor: "#ece5d6" }}
                      disabled={locked}
                    >
                      <CloseOutlined style={{ fontSize: "0.7rem" }} />
                    </Button>
                  </Tooltip>
                </div>
              ))}
            </div>
          }
        >
          <InfoCircleOutlined
            style={{ fontSize: "1.15rem", cursor: "pointer", color: "green" }}
          />
        </Popover>
      )}
      <PaperClipOutlined rotate={135} style={{ fontSize: "1.5rem" }} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept={ALLOWED_TYPES.map((type) => `.${type}`).join(",")}
        className={style.fileInput}
      />
    </div>
  );
};

export default UploadFiles;