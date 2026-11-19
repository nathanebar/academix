// src/components/Forms/QuestionsComponents/FileQuestion/FileQuestion.tsx
import React, { useCallback, useEffect, useState } from "react";
import style from "./FileQuestion.module.css";
import {
  DownloadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  CloudUploadOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import { Button, message, Tooltip, Upload } from "antd";
import type { UploadProps, UploadFile } from "antd";
import { usePermissionStore } from "../../../../store/permissionStore";
import FormGrade from "../../../../UI/FormGrade/FormGrade";
import { ReactComponent as EditIcon } from "../../../../media/icons/Edit Icon.svg";
import { useSearchParams } from "react-router-dom";
import { uploadFilesToS3 } from "../../../../store/taskStore";
import axios from "axios";

const FileQuestion = (props: any) => {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [trigger, setTrigger] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);

  const [uploadedFileData, setUploadedFileData] = useState<{
    s3Key: string;
    name: string;
    s3BucketName: string;
  } | null>(null);

  const { selectedPermission } = usePermissionStore();
  const [searchParams] = useSearchParams();
  const isSurvey = searchParams.get("isSurvey");

  const {
    questionId,
    question: questionText,
    required,
    points,
    renderFor,
    options,
    submission,
    formData,
    setFormData,
    files = [],
    formSubmissionId,
  } = props;

  const existingAnswer = formData?.find(
    (item: any) => item.form_question_id === questionId
  );

  const preparedFile = files?.[0];

  const decodeFileName = (fileName: string | undefined): string => {

    if (!fileName) {
      return "קובץ לא ידוע";
    }

    if (fileName.includes('%')) {
      try {
        const decoded = decodeURIComponent(fileName);
        return decoded;
      } catch (e) {
        return fileName;
      }
    }
    return fileName;
  };

  const studentSubmittedFileName =
    decodeFileName(submission?.[0]?.fileName) ||
    decodeFileName(submission?.[0]?.name) ||
    decodeFileName(submission?.[0]?.decodedFileName) ||
    submission?.[0]?.value_text?.split("/").pop() ||
    "קובץ לא ידוע";

  const studentSubmittedFile = submission?.[0]?.value_text;
  const hasSubmittedFile = studentSubmittedFile && studentSubmittedFile.length > 0;

  useEffect(() => {
    if (hasSubmittedFile) {
      setUploadedFileData({
        s3Key: studentSubmittedFile,
        name: studentSubmittedFileName,
        s3BucketName: submission?.[0]?.s3BucketName || "academix",
      });

      setUploadedFile({
        uid: '-1',
        name: studentSubmittedFileName,
        status: 'done',
        url: studentSubmittedFile,
      } as UploadFile);
    }
  }, [hasSubmittedFile, studentSubmittedFile, studentSubmittedFileName]);

  useEffect(() => {
    props.setFormData((prev: any) => {
      const existingIndex = prev?.findIndex(
        (item: any) => item.form_question_id === props.questionId
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex] };
        return updated;
      } else {
        return [...prev, { form_question_id: props.questionId }];
      }
    });
  }, []);

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("pdf")) return <FilePdfOutlined style={{ color: "#e74c3c", fontSize: "2.5rem" }} />;
    if (fileType?.includes("word") || fileType?.includes("document")) return <FileWordOutlined style={{ color: "#2b5797", fontSize: "2.5rem" }} />;
    if (fileType?.includes("excel") || fileType?.includes("spreadsheet")) return <FileExcelOutlined style={{ color: "#217346", fontSize: "2.5rem" }} />;
    if (fileType?.includes("image")) return <FileImageOutlined style={{ color: "#27ae60", fontSize: "2.5rem" }} />;
    return <FileOutlined style={{ color: "#7f8c8d", fontSize: "2.5rem" }} />;
  };

  const handleDownload = useCallback(async (file: any, downloadType: 'prepared' | 'submitted' = 'prepared') => {
    try {
      setDownloading(0);

      let key: string;
      let fileName: string;

      if (downloadType === 'submitted') {
        key = submission?.[0]?.value_text || file.value_text || file.name;
        fileName = studentSubmittedFileName;
      } else {
        key = file.s3Key || file.key || file.name;
        fileName = file.name;
      }

      console.log("📥 Downloading:", { key, fileName, downloadType });

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/files/download-file`,
        {
          params: {
            key: key,
            fileName: fileName,
          },
          responseType: 'blob',
          withCredentials: true,
        }
      );

      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

      message.success("הקובץ הורד בהצלחה!");

    } catch (error) {
      message.error("שגיאה בהורדת הקובץ");
    } finally {
      setDownloading(null);
    }
  }, [submission]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload: UploadProps["onChange"] = async (info) => {
    const { fileList } = info;

    if (fileList.length > 0) {
      const lastFile = fileList[fileList.length - 1];
      setUploadedFile(lastFile);
    }

    if (fileList.length === 0) return;

    const currentFile = fileList[fileList.length - 1];
    const rawFile = (currentFile as any).originFileObj || currentFile;

    if (!(rawFile instanceof File) && !rawFile.name) {
      console.error("❌ Not a valid file");
      return;
    }

    try {
      setUploading(true);

      const response = await uploadFilesToS3(
        [rawFile as File],
        null,
        null,
        false,
        true,
        undefined
      );

      const responseData = response?.[0]?.data;

      if (responseData) {
        const fileData = {
          s3Key: responseData.s3Key,
          name: responseData.name, 
          s3BucketName: responseData.s3BucketName || "academix",
          fileId: responseData.id,
        };

        setUploadedFileData(fileData);
        props.setFormData((prev: any) => {
          const existingIndex = prev?.findIndex(
            (item: any) => item.form_question_id === props.questionId
          );

          const updatedAnswer = {
            form_question_id: props.questionId,
            value_text: fileData.s3Key,
            name: fileData.name, 
          };

          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...updatedAnswer };
            return updated;
          } else {
            return [...prev, updatedAnswer];
          }
        });

        setUploadedFile({
          uid: '-1',
          name: fileData.name, 
          status: 'done',
          url: fileData.s3Key,
        } as UploadFile);

        message.success("הקובץ הועלה בהצלחה!");
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      message.error("שגיאה בהעלאת הקובץ");
    } finally {
      setUploading(false);
    }
  };



  if (!files || files.length === 0) {
    return (
      <div className={style["file-question-container"]}>
        <div className={style["no-files"]}>
          <FileOutlined style={{ fontSize: "2rem", color: "#999" }} />
          <p>אין קבצים מצורפים לשאלה זו</p>
        </div>
      </div>
    );
  }

  return (
    <div className={style["file-question-container"]}>
      {preparedFile && (
        <div className={style["prepared-file-section"]}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontWeight: 600 }}>
            <FileTextOutlined style={{ color: "#2b5d8a" }} />
            קובץ למבחן
          </h4>
          <div className={style["file-card"]} style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}>
            <div className={style["file-icon"]}>{getFileIcon(preparedFile.type)}</div>
            <div className={style["file-info"]}>
              <span className={style["file-name"]} title={preparedFile.name}>{preparedFile.name}</span>
              <span className={style["file-meta"]}>
                {formatFileSize(preparedFile.size)} • {preparedFile.type?.split("/")[1] || "קובץ"}
              </span>
            </div>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloading === 0}
              onClick={() => handleDownload(preparedFile, 'prepared')}
              className={style["download-btn"]}
            >
              הורד
            </Button>
          </div>
        </div>
      )}

      {renderFor === "answer" && (
        <div style={{ marginTop: "24px", padding: "20px", background: "#fff", borderRadius: "12px", border: "2px dashed #2b5d8a" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontWeight: 600, color: "#2b5d8a" }}>
            <CloudUploadOutlined />
            העלה קובץ תשובה
          </h4>

          <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px", direction: "rtl", textAlign: "right", lineHeight: "1.6" }}>
            לאחר שתוריד את קובץ המבחן, ענה על השאלות והעלה את קובץ התשובה שלך כאן.
            <br />
            <span style={{ color: "#999", fontSize: "12px" }}>נתמכים: PDF, Word, Excel, תמונות</span>
          </p>

          <Upload.Dragger
            name="file"
            multiple={false}
            showUploadList={true}
            beforeUpload={() => false}
            onChange={handleFileUpload}
            disabled={uploading}
            fileList={uploadedFile ? [uploadedFile] : []}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ fontSize: "3rem", color: "#2b5d8a" }} />
            </p>
            <p className="ant-upload-text" style={{ direction: "rtl" }}>גרור קובץ לכאן או לחץ</p>
            <p className="ant-upload-hint" style={{ direction: "rtl" }}>לחץ או גרור קובץ</p>
          </Upload.Dragger>

          {uploadedFileData && (
            <div style={{ marginTop: "16px", padding: "16px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", direction: "rtl", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#16a34a", fontSize: "24px" }}>✓</span>
              <div>
                <div style={{ fontWeight: 600, color: "#15803d" }}>הקובץ "{uploadedFileData.name}" הועלה בהצלחה</div>
                <div style={{ fontSize: "12px", color: "#166534" }}>לחץ "שמור" בסוף הטופס כדי לשלוח</div>
              </div>
            </div>
          )}
        </div>
      )}

      {(renderFor === "show" || renderFor === "grading") && hasSubmittedFile && (
        <div className={style["prepared-file-section"]}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontWeight: 600, color: "#059669" }}>
            <FileTextOutlined />
            קובץ תשובה שהוגש
          </h4>
          <div className={style["file-card"]} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className={style["file-icon"]}>
              {getFileIcon(submission?.[0]?.type)}
            </div>
            <div className={style["file-info"]}>
              <span className={style["file-name"]}>
                {studentSubmittedFileName}
              </span>
              {submission?.[0]?.size && (
                <span className={style["file-meta"]}>
                  {formatFileSize(submission?.[0]?.size)}
                </span>
              )}
            </div>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload({ value_text: studentSubmittedFile, name: studentSubmittedFileName }, 'submitted')}
              style={{ background: "#059669", borderColor: "#059669" }}
            >
              הורד
            </Button>
          </div>
        </div>
      )}

      {(renderFor === "show" || renderFor === "grading") && !hasSubmittedFile && (
        <div style={{ marginTop: "16px", padding: "12px 16px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fcd34d", direction: "rtl" }}>
          <span style={{ fontSize: "18px", marginLeft: "8px" }}>⚠️</span>
          <span style={{ color: "#92400e" }}>התלמיד טרם העלה קובץ תשובה</span>
        </div>
      )}

      {renderFor === "show" && !trigger && !isSurvey && (
        <div style={{ width: "90%", display: "flex", alignItems: "center", direction: 'rtl', marginTop: "16px" }}>
          <div className={style["grade_wrapper"]}>
            <div className={style["grade"]}>
              <span>{points}</span>
              <span>/</span>
              <span>{submission?.[0]?.pointEarned}</span>
            </div>
            <div className={style["note"]}>
              <span style={{ fontWeight: "bold", marginLeft: ".5vw" }}>הערת הבודק/ת:</span>
              <Tooltip color="gray" title={submission?.[0]?.instructor_note?.trim().length >= 80 ? submission?.[0]?.instructor_note : ""}>
                <span>
                  {submission?.[0]?.instructor_note && submission?.[0]?.instructor_note.length >= 80
                    ? `${submission?.[0]?.instructor_note.substring(0, 74)}...`
                    : submission?.[0]?.instructor_note}
                </span>
              </Tooltip>
            </div>
          </div>
          {selectedPermission?.role_code !== "STUDENT" && selectedPermission?.role_code !== "OVERLAP" && (
            <Tooltip title="ערוך מבחן">
              <EditIcon onClick={() => setTrigger(!trigger)} style={{ fontSize: "0.2vh", height: "1.5vh", cursor: "pointer", marginRight: "0.5vw" }} />
            </Tooltip>
          )}
        </div>
      )}

      {renderFor === "grading" && (
        <div style={{ width: "90%", marginTop: "16px" }}>
          <FormGrade props={props} />
        </div>
      )}

      {renderFor === "show" && trigger && (
        <div style={{ width: "90%", marginTop: "16px" }}>
          <FormGrade trigger={trigger} setTrigger={setTrigger} props={props} />
        </div>
      )}
    </div>
  );
};

export default FileQuestion;