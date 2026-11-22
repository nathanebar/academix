// QuestionsComponents/FileUploadQuestion/FileUploadQuestion.tsx
import React, { useCallback, useEffect, useState } from "react";
import api from "../../../../api/axios";
import { Upload, Button, message, Tooltip } from "antd";
import {
  UploadOutlined,
  FileOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import style from "./FileUploadQuestion.module.css";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import { getCurrentSelectValue } from "../../../../utils/getCurrentSelectValue";
import headerQuestionStyle from "../questionHeader.module.css";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import { QuestionType } from "../../../../types/types";

interface FileUploadQuestionProps {
  question: any;
  questionIndex: number;
  isRequired?: boolean;
  disabled?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onSelectChange?: (value: number, questionIndex: number) => void;
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  existingFiles?: any[];
}

const FileUploadQuestion: React.FC<FileUploadQuestionProps> = (props) => {
  const {
    question,
    questionIndex = 0,
    isRequired = false,
    disabled = false,
    maxFileSize = 10,
    allowedTypes = [
      "pdf",
      "doc",
      "docx",
      "jpg",
      "jpeg",
      "png",
      "mp3",
      "mp4",
      "msg",
    ],
    maxFiles = 1,
    onSelectChange,
    setQuestionsForEdit,
    existingFiles = [],
  } = props;

  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    if (existingFiles?.length > 0) {
      setFileList(
        existingFiles.map((file: any, idx) => ({
          uid: String(file.id || `existing-${idx}`),
          name: file.name,
          size: file.size || 0,
          type: file.type || "",
          status: "done" as const,
          s3Key: file.s3Key,
          id: file.id,
          url:
            file.url ||
            `${process.env.REACT_APP_API_BASE_URL}/files/${file.s3Key}`,
          isExisting: true,
        }))
      );
    }
  }, [existingFiles]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const beforeUpload = (file: File) => {
    if (file.size > maxFileSize * 1024 * 1024) {
      message.error(`הקובץ גדול מדי. מקסימום ${maxFileSize}MB`);
      return Upload.LIST_IGNORE;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(ext || "")) {
      message.error(`סוג קובץ לא נתמך. מותרים: ${allowedTypes.join(", ")}`);
      return Upload.LIST_IGNORE;
    }
    if (fileList.length >= maxFiles) {
      message.error(`מקסימום ${maxFiles} קבצים`);
      return Upload.LIST_IGNORE;
    }
    return false; // on garde le File en mémoire (pas d'upload auto)
  };

  const syncUploadedFiles = (nextFileList: any[]) => {
    setFileList(nextFileList);

    if (!setQuestionsForEdit) return;
    setQuestionsForEdit((prev: any) => ({
      questions: prev.questions.map((q: any, idx: number) =>
        idx === questionIndex
          ? {
              ...q,
              uploadedFiles: nextFileList.map((x) => ({
                uid: x.uid,
                name: x.name,
                size: x.size,
                type: x.type,
                file: x.originFileObj || undefined, // File brut → multipart
                isExisting: !!x.isExisting,
                id: x.id, // ← nouveau (fichier existant)
                key: x.s3Key || undefined,
                bucket: x.bucket || (x.isExisting ? "academix" : undefined),
              })),
              // Fichiers existants retirés dans l'éditeur → à supprimer au save
              removedFileIds: (existingFiles || [])
                .filter(
                  (ef: any) =>
                    !nextFileList.some(
                      (nf: any) =>
                        nf.isExisting && Number(nf.id) === Number(ef.id)
                    )
                )
                .map((ef: any) => ef.id),
            }
          : q
      ),
    }));
  };

  const handleChange = ({ fileList: newFileList }: any) => {
    syncUploadedFiles(newFileList);
  };

  const handleDelete = (uid: string) => {
    const next = fileList.filter((f) => f.uid !== uid);
    syncUploadedFiles(next);
  };

  const handleEdit = (file: any) => {
    // NB : pour l'édition d'un fichier déjà uploadé, on pourrait remplacer le File
    // mais on garde simple : la création d'un form ne ré-édite pas en général.
    message.info("עריכת קובץ זמינה בגרסת העריכה");
  };
  const handleQuestionTextChange = (text: string) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, text } : q
      ),
    }));
  };
  const handleDownload = async (file: any) => {
    try {
      const key = file.s3Key || file.key;
      const { data: blob } = await api.get<Blob>(
        `/files/download-file?key=${encodeURIComponent(key)}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      message.error("שגיאה בהורדת הקובץ");
    }
  };

  return (
    <div className={style.container} style={{ direction: "rtl" }}>
      <div className={headerQuestionStyle.questionContainer}>
        <div className={headerQuestionStyle["input-container"]}>
          <RegularInput
            width="30.33796296296296vw"
            borderRadius="10px"
            height="4.2vh"
            placeholder="שאלה"
            value={question.text}
            setValue={handleQuestionTextChange}
          />
        </div>
        <QuestionTypeSelect
          value={getCurrentSelectValue(props)}
          onChange={(value) => onSelectChange?.(value, questionIndex)}
        />
      </div>
      <div className={style.uploadArea}>
        {fileList.length < maxFiles && (
          <Upload.Dragger
            name="file"
            multiple={maxFiles > 1}
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            showUploadList={{ showRemoveIcon: false, showPreviewIcon: true }}
            disabled={disabled}
            className={style.dragger}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 40, color: "#999" }} />
            </p>
            <p className="ant-upload-text">גרור קובץ לכאן או לחץ לבחירה</p>
          </Upload.Dragger>
        )}

        {fileList.length > 0 && (
          <div className={style.selectedFiles}>
            <div className={style.filesHeader}>
              <span>
                קבצים ({fileList.length}/{maxFiles})
              </span>
            </div>
            {fileList.map((file: any) => (
              <div key={file.uid} className={style.fileItem}>
                <div className={style.fileInfo}>
                  <FileOutlined style={{ fontSize: 30, color: "#666" }} />
                  <div>
                    <div className={style.fileName}>{file.name}</div>
                    {file.size && (
                      <div className={style.fileSize}>
                        {formatFileSize(file.size)}
                      </div>
                    )}
                  </div>
                </div>
                <div className={style.fileActions}>
                  {file.s3Key && (
                    <Tooltip title="הורד קובץ">
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(file)}
                      />
                    </Tooltip>
                  )}
                  {!disabled && (
                    <Tooltip title="מחק">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(file.uid)}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isRequired && !disabled && fileList.length === 0 && (
        <div className={style.errorMessage}>יש להעלות קובץ (שדה חובה)</div>
      )}
    </div>
  );
};

export default FileUploadQuestion;
