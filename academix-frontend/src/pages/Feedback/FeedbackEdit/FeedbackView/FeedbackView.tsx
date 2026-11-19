// src/components/FeedbackView/FeedbackView.tsx
import React, { JSX, useEffect, useState } from "react";
import { Button, Spin, Alert, Descriptions, Tag, Divider, List } from "antd";
import {
  CheckOutlined,
  DownloadOutlined,
  FileJpgOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import style from "../FeedbackForm/FeedbackForm.module.css"; // חוזרים על אותו CSS
import { useFeedbackByAssignment } from "../../../../hooks/useFeedbackByAssignment";
import { useFetchFilesByFeedbackAnswerId } from "../../../../hooks/useFetchFilesByFeedbackAnswerId";
import UploadFiles from "../../../../components/NewTaskModal/Inputs/UploadFiles/UploadFiles";
import Audio from "../../../../components/UserTaskModal/Audio/Audio";
import Video from "../../../../components/UserTaskModal/Video/Video";
import stringCheckAndToolTip from "../../../../utils/stringCheck";
import { formatDateHe } from "../../../../utils/date";
import { FileCard } from "../../FileCard/FileCard";
import { usePermissionStore } from "../../../../store/permissionStore";
import ReactPlayer from "react-player";
import WaveSurferComponent from "../../../../components/UserTaskModal/Audio/WaveSurfer";
import { useLocation } from "react-router-dom";
import TextArea from "antd/es/input/TextArea";
// import { FileCard } from '../../FileCard/FileCard';
// import { useFeedbackByAssignment } from '../../hooks/useFeedbackByAssignment';
// import { useFetchFilesByFeedbackAnswerId } from '../../hooks/useFetchFilesByFeedbackAnswerId';
// import UploadFiles from '../../components/NewTaskModal/Inputs/UploadFiles/UploadFiles';

type Props = {
  taskAssignmentId: number;
};

const FeedbackView: React.FC<Props> = ({ taskAssignmentId }) => {
  const { selectedPermission } = usePermissionStore();
  const {
    data: feedbackRes,
    isLoading: feedbackLoading,
    isError: feedbackError,
    error: feedbackErrObj,
  } = useFeedbackByAssignment(taskAssignmentId, selectedPermission?.role_code);
  const feedbackAnswerId = feedbackRes?.data?.feedbackId;

  const {
    data: files,
    isLoading: filesLoading,
    isError: filesError,
  } = useFetchFilesByFeedbackAnswerId(taskAssignmentId);

  const [taskRelatedFiles, setTaskRelatedFiles] = useState<any[]>([]);
  const { state } = useLocation();
  useEffect(() => {
    if (Array.isArray(files) && files.length > 0) {
      setTaskRelatedFiles(files);
    } else {
      setTaskRelatedFiles([]);
    }
  }, [files]);

  if (feedbackLoading) {
    return (
      <div className={style.container}>
        <Spin tip="טוען משוב..." />
      </div>
    );
  }

  if (feedbackError) {
    return (
      <div className={style.container}>
        <Alert
          type="error"
          message="שגיאת טעינה"
          description={(feedbackErrObj as Error).message}
        />
      </div>
    );
  }

  if (!feedbackRes?.success) {
    return (
      <div className={style.container}>
        <Alert type="warning" message="לא נמצא משוב עבור משימה זו." />
      </div>
    );
  }

  const fb = feedbackRes.data;
  const hasAnswered = fb.hasUserAnswered;

  const assignmentDate = formatDateHe(fb?.assignmentDate);

  const renderCategories = (fb: any) => {
    if (!fb?.categories?.length) return null;

    const sorted = [...fb.categories].sort((a: any, b: any) =>
      a.selection_type === b.selection_type
        ? 0
        : a.selection_type === "improvement"
        ? -1
        : 1
    );

    const improvements = sorted.filter(
      (c: any) => c.selection_type === "improvement"
    );
    const preservations = sorted.filter(
      (c: any) => c.selection_type === "preservation"
    );

    const renderGroup = (title: string, items: any[]): JSX.Element | null => {
      if (!items.length) return null;

      return (
        <>
          <h4 className={style.groupTitle}>{title}</h4>

          <div className={style.groupList}>
            {items.map((category: any) => {
              const status = category.selection_type;

              const statusClass = status ? style[status] : "";
              const classNames = `${style.categorieView} ${statusClass}`.trim();

              return (
                <div key={category.id} className={classNames}>
                  <span>{category.name}</span>
                </div>
              );
            })}
          </div>
        </>
      );
    };

    return (
      <div className={style.categoriesSection}>
        {renderGroup("קטגוריות לשיפור", improvements)}

        {renderGroup("קטגוריות לשימור", preservations)}
      </div>
    );
  };

  const renderQuestions = () => (
    <List
      dataSource={fb.questions}
      renderItem={(q: any) => (
        <List.Item>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="-">{q.question_text}</Descriptions.Item>
            <Descriptions.Item label="-">{q.answer || "—"}</Descriptions.Item>
          </Descriptions>
        </List.Item>
      )}
    />
  );
  const baseUrl = process.env.REACT_APP_S3_BASE_URL!;

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
    }
  };

  const getFilePreview = (file: any) => {
    const fileName = file?.name || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const fileUrl = `${process.env.REACT_APP_S3_BASE_URL}/${file?.s3BucketName}/${file?.s3Key}`;

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
              // disabled={isSubmitted}
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
            // opacity: isSubmitted ? 0.7 : 1,
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
            // opacity: isSubmitted ? 0.7 : 1,
          }}
        >
          <ReactPlayer
            url={fileUrl}
            width="100%"
            height="100%"
            // controls={!isSubmitted}
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
          // opacity: isSubmitted ? 0.7 : 1,
        }}
      >
        <FileJpgOutlined style={{ fontSize: "1.5rem" }} />
        <span>{fileName}</span>
        <Button
          icon={<DownloadOutlined />}
          href={fileUrl}
          download={fileName}
          size="small"
          // disabled={isSubmitted}
          onClick={(e) => {
            e.preventDefault();
          }}
        />
      </div>
    );
  };

  return (
    <div className={style.container}>
      <h2>
        משוב על תרגיל {fb.taskName} - {assignmentDate}
      </h2>

      {(feedbackRes?.data?.seenGrade ||
        selectedPermission?.role_code !== "STUDENT") && (
        <div>
          <span className={style.heading}>
            {fb.select_option_score !== 10 ? "סיכום במילה" : "סיכום בציון"}
          </span>
          <span
            style={{
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              width: "10vw",
            }}
          >
            מושב על ידי -{state}
          </span>
          <div className={style.ratingOptionsContainerView}>
            <div className={`${style.ratingOptionItemView} `}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>
                {fb.select_option_score !== 10
                  ? fb.selectedOptionLabel
                  : fb.finelScore}
              </span>
            </div>
          </div>
        </div>
      )}

      <div>{renderCategories(fb)}</div>

      <div className={style.commentContainerView}>
        {selectedPermission?.role_code !== "STUDENT" ? (
          <h3 style={{ margin: 0, paddingBottom: "10px" }}>הערה לחניך:</h3>
        ) : (
          ""
        )}
        <TextArea
          rows={3}
          style={{
            color: "rgba(94, 99, 102, 1)",
            background: "rgba(244, 241, 235, 1)",
            resize: "none",
            minHeight: "12vh",
          }}
          value={fb.comment || "אין הערה"}
          readOnly
        />
      </div>
      {selectedPermission?.role_code !== "STUDENT" ? (
        <>
          <div
            style={{ backgroundColor: "rgb(255, 250, 230)" }}
            className={style.commentContainerView}
          >
            <h3 style={{ margin: 0, paddingBottom: "10px" }}>
              הערה לדרג פיקודי:
            </h3>
            <TextArea
              rows={3}
              style={{
                color: "rgba(94, 99, 102, 1)",
                background: "rgba(244, 241, 235, 1)",
                resize: "none",
                minHeight: "12vh",
              }}
              value={
                fb.leaders_only_comment
                  ? fb.leaders_only_comment
                  : "אין הערה לדרג פיקודי"
              }
              readOnly
            />
          </div>
        </>
      ) : undefined}

      {taskRelatedFiles.length !== 0 && (
        <div className={style.relevant_missions2}>
          <p className={style.heading}>קבצים :</p>
          <div className={style.grid}>
            {taskRelatedFiles.map((element) => {
              const file = element;

              return file ? (
                <div key={file.id} style={{ marginBottom: "10px" }}>
                  {getFilePreview(file)}
                </div>
              ) : null;

              /*   <FileCard
                key={f.id}
                file={f}
                baseUrl={baseUrl}
                stringCheckAndToolTip={stringCheckAndToolTip}
              /> */
            })}
          </div>
        </div>
      )}
      {fb.questions.length !== 0 && (
        <div style={{ marginTop: 15 }}>{renderQuestions()}</div>
      )}
    </div>
  );
};

export default FeedbackView;
