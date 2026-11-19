import { useEffect, useMemo, useState, useRef } from "react";
import {
  Spin,
  Empty,
  message,
  Modal,
  Input,
  Upload,
  Progress,
  Tooltip,
  type InputRef,
} from "antd";
import {
  FileTextOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileZipOutlined,
  VideoCameraOutlined,
  FolderFilled,
  RightOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useCourseBatchFiles } from "../../hooks/useCourseBatchFiles";
import {
  useCourseBatchFolders,
  FolderFile,
} from "../../hooks/useCourseBatchFolders";
import { schemaMap } from "../../types/types";
import { HeaderPermissionDisplay } from "../../components/HeaderPermissionDisplay";
import { useCourseBatchStore } from "../../store/courseBatchStore";
import styles from "./KnowledgeRetention.module.css";
import { useSelectionsStore } from "../../store/selectionStore";

interface UserInfo {
  name?: string;
  username?: string;
}

interface FileData {
  id: number;
  name: string;
  type: string;
  size: number;
  s3Key: string;
  s3BucketName: string;
  createdAt: string;
  isPatbass: boolean;
  feedback_answer_id?: number | null;
  task?: {
    id: number;
    name: string;
    User?: UserInfo;
    TaskGroup?: {
      id: number;
      name: string;
      Axis?: {
        id: number;
        name: string;
        color: string;
        team_id?: number;
        User?: UserInfo;
      };
    };
  };
}

interface AxisFolder {
  id: number;
  name: string;
  color: string;
  repository_kind: string;
  creatorName?: string;
  isCustom?: boolean;
  team_id?: number;
  team_member_id?: number;
  files: FileData[];
  customFiles?: FolderFile[];
}

const CustomFolderLatestDate = ({
  folderId,
  useFolderFiles,
}: {
  folderId: number;
  useFolderFiles: any;
}) => {
  const { data: customFiles = [] } = useFolderFiles(folderId);

  const latestDate = useMemo(() => {
    if (!customFiles.length) return null;
    const latest = customFiles.reduce(
      (latestFile: FolderFile, file: FolderFile) =>
        new Date(file.created_at).getTime() >
        new Date(latestFile.created_at).getTime()
          ? file
          : latestFile
    );
    return latest.created_at;
  }, [customFiles]);

  return (
    <span>
      {latestDate
        ? new Date(latestDate).toLocaleDateString("he-IL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "-"}
    </span>
  );
};

const CustomFolderFileCount = ({
  folderId,
  useFolderFiles,
}: {
  folderId: number;
  useFolderFiles: any;
}) => {
  const { data: customFiles = [] } = useFolderFiles(folderId);
  return <>{customFiles?.length ?? 0}</>;
};

const TruncatedText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const content = text ?? "";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollWidth > el.clientWidth + 1);
  }, [content, className]);

  return (
    <Tooltip title={isTruncated ? content : undefined}>
      <span ref={ref} className={className}>
        {content}
      </span>
    </Tooltip>
  );
};

const getFileIconAndColor = (file: any) => {
  const fileName = file?.name || "";
  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
    : "";
  const mime = file?.type || "";

  if (
    ext === ".mp4" ||
    ext === ".mov" ||
    ext === ".mkv" ||
    ext === ".avi" ||
    ext === ".webm" ||
    ext === ".flv" ||
    ext === ".wmv" ||
    ext === ".m4v" ||
    ext === ".mpg" ||
    ext === ".mpeg" ||
    ext === ".3gp" ||
    mime.startsWith("video/")
  ) {
    return { icon: <VideoCameraOutlined />, color: "#E91E63" };
  }

  if (
    ext === ".doc" ||
    ext === ".docx" ||
    mime.includes("word") ||
    mime.includes("msword")
  ) {
    return { icon: <FileWordOutlined />, color: "#2B579A" };
  }
  if (
    ext === ".xls" ||
    ext === ".xlsx" ||
    mime.includes("excel") ||
    mime.includes("spreadsheet")
  ) {
    return { icon: <FileExcelOutlined />, color: "#217346" };
  }
  if (ext === ".pdf" || mime === "application/pdf") {
    return { icon: <FilePdfOutlined />, color: "#D93025" };
  }
  if (
    ext === ".ppt" ||
    ext === ".pptx" ||
    mime.includes("powerpoint") ||
    mime.includes("presentation")
  ) {
    return { icon: <FilePptOutlined />, color: "#D24726" };
  }
  if (
    ext === ".png" ||
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".gif" ||
    ext === ".bmp" ||
    ext === ".svg" ||
    ext === ".webp" ||
    mime.startsWith("image/")
  ) {
    return { icon: <FileImageOutlined />, color: "#9C27B0" };
  }
  if (
    ext === ".zip" ||
    ext === ".rar" ||
    ext === ".7z" ||
    mime.includes("zip") ||
    mime.includes("compressed")
  ) {
    return { icon: <FileZipOutlined />, color: "#8B6F47" };
  }
  if (ext === ".txt" || mime.startsWith("text/")) {
    return { icon: <FileTextOutlined />, color: "#757575" };
  }

  return { icon: <FileTextOutlined />, color: "#3A547F" };
};

const KnowledgeRetention = () => {
  const {
    selectedTeam,
    selectedCourseBatch,
    selectedTeamMember,
    activeHeaderType,
  } = useSelectionsStore();
  const { axisBatchArchive } = useCourseBatchStore();
  const queryClient = useQueryClient();
  const { data: filesData = [], isLoading: isLoadingFiles } =
    useCourseBatchFiles();
  const files: FileData[] = Array.isArray(filesData) ? filesData : [];

  const {
    allFolders,
    isLoadingCustomFolders,
    createFolder,
    deleteFolder,
    updateFolder,
    isCreating,
    isDeleting,
    isUpdating,
    useFolderFiles,
    uploadFile,
    deleteFile,
    isUploading,
  } = useCourseBatchFolders({ teamMemberMode: true });

  const [selectedAxis, setSelectedAxis] = useState<AxisFolder | null>(null);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const newFolderInputRef = useRef<InputRef>(null);
  const editFolderInputRef = useRef<InputRef>(null);

  const { data: customFolderFiles = [] } = useFolderFiles(
    selectedAxis?.isCustom ? selectedAxis.id : 0
  );

  const isTeamMemberView =
    activeHeaderType === "teamMember" && !!selectedTeamMember;
  const canEnterAxes = isTeamMemberView || !!selectedTeam;

  useEffect(() => {
    setSelectedAxis(null);
    setEditingFolderId(null);
    setEditFolderName("");
  }, [selectedTeamMember?.id, selectedTeam?.id]);

  const teamMemberTaskIds = useMemo(() => {
    if (!isTeamMemberView) return new Set<number>();
    const set = new Set<number>();

    const userId =
      selectedTeamMember?.user_id ??
      selectedTeamMember?.User?.id ??
      selectedTeamMember?.id;

    if (!userId) return set;

    (axisBatchArchive as any[]).forEach((item: any) => {
      const task = item?.Task || item?.task || item;
      const taskId = task?.id || item?.task_id;

      if (!taskId) return;

      if (Array.isArray(task?.assignments)) {
        const isAssigned = task.assignments.some(
          (a: any) =>
            a.user_id === userId ||
            a.team_member_id === selectedTeamMember?.id ||
            a.team_member_id === userId
        );
        if (isAssigned) set.add(taskId);
      }

      if (
        item?.assignedTo?.user_id === userId ||
        item?.assignedTo?.member_id === userId
      ) {
        set.add(taskId);
      }
    });

    return set;
  }, [axisBatchArchive, selectedTeamMember, isTeamMemberView]);

  const visibleFiles = useMemo(() => {
    return files;
  }, [files]);

  const filesByAxis = useMemo(() => {
    const grouped: Map<number, FileData[]> = new Map();
    visibleFiles.forEach((file) => {
      const axis = file.task?.TaskGroup?.Axis;
      if (!axis) return;
      const existing = grouped.get(axis.id) || [];
      existing.push(file);
      grouped.set(axis.id, existing);
    });
    return grouped;
  }, [visibleFiles]);

  const foldersWithFiles = useMemo(() => {
    if (isTeamMemberView) {
      const axisMap = new Map<number, AxisFolder>();

      filesByAxis.forEach((axisFiles, axisId) => {
        const firstFile = axisFiles[0];
        const axis = firstFile.task?.TaskGroup?.Axis;
        if (!axis) return;

        axisMap.set(axisId, {
          id: axisId,
          name: axis.name,
          color: axis.color || "gray",
          repository_kind: "operational",
          files: axisFiles,
          customFiles: [],
        });
      });

      allFolders.forEach((axis) => {
        if (axis.isCustom) {
          axisMap.set(axis.id, {
            ...axis,
            files: [],
            customFiles: [],
          });
        }
      });

      return Array.from(axisMap.values())
        .map((axis) => ({
          ...axis,
          files: axis.files.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "he"));
    }

    const allAxisMap = new Map<number, AxisFolder>();
    allFolders.forEach((axis) => {
      allAxisMap.set(axis.id, {
        ...axis,
        files: axis.isCustom ? [] : [],
        customFiles: [],
      });
    });

    filesByAxis.forEach((axisFiles, axisId) => {
      const existing = allAxisMap.get(axisId);
      if (existing) {
        existing.files = axisFiles;
      } else {
        const firstFile = axisFiles[0];
        const axis = firstFile.task?.TaskGroup?.Axis;
        allAxisMap.set(axisId, {
          id: axisId,
          name: axis?.name || "ציר",
          color: axis?.color || "gray",
          repository_kind: "operational",
          files: axisFiles,
          customFiles: [],
        });
      }
    });

    return Array.from(allAxisMap.values())
      .map((axis) => ({
        ...axis,
        files: axis.files.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [allFolders, filesByAxis, isTeamMemberView]);

  const selectedAxisWithFiles = useMemo(() => {
    if (!selectedAxis) return null;

    const folder =
      foldersWithFiles.find((f) => f.id === selectedAxis.id) || selectedAxis;

    if (selectedAxis.isCustom) {
      return {
        ...folder,
        files: [],
        customFiles: customFolderFiles,
      };
    }

    return folder;
  }, [selectedAxis, foldersWithFiles, customFolderFiles]);

  const handleDownload = (file: FileData) => {
    const teamMemberQuery =
      isTeamMemberView && selectedTeamMember?.id
        ? `&teamMemberId=${selectedTeamMember.id}`
        : "";
    const teamQuery =
      !isTeamMemberView && selectedTeam?.id ? `&teamId=${selectedTeam.id}` : "";

    const downloadUrl = `${
      process.env.REACT_APP_API_BASE_URL
    }/files/download-file?key=${encodeURIComponent(
      file.s3Key
    )}&fileName=${encodeURIComponent(file.name)}${teamMemberQuery}${teamQuery}`;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 60000);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(
      { name: newFolderName.trim() },
      {
        onSuccess: () => {
          setIsAddingFolder(false);
          setNewFolderName("");
          queryClient.refetchQueries({ type: "active" });
          message.success("התיקייה נוצרה בהצלחה");
        },
        onError: () => {
          message.error("שגיאה ביצירת התיקייה");
        },
      }
    );
  };

  const handleCancelAddFolder = () => {
    setIsAddingFolder(false);
    setNewFolderName("");
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedAxis?.isCustom) return false;

    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : "";

    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    const s3Key = `folder-files/${selectedAxis.id}/${uniqueName}${ext}`;

    try {
      await uploadFile(
        {
          folderId: selectedAxis.id,
          file,
          s3Key,
          bucket: process.env.REACT_APP_S3_BUCKET || "academix",
        },
        {
          onSuccess: () => {
            setUploadProgress(100);
            queryClient.refetchQueries({ type: "active" });
            message.success("הקובץ הועלה בהצלחה");
            setTimeout(() => setUploadProgress(0), 500);
          },
          onError: () => {
            setUploadProgress(0);
            message.error("שגיאה בהעלאת הקובץ");
          },
        }
      );
    } catch (error) {
      message.error("שגיאה בהעלאת הקובץ");
    }

    return false;
  };

  const handleDeleteCustomFile = (fileId: number) => {
    Modal.confirm({
      title: "מחיקת קובץ",
      content: "האם אתה בטוח שברצונך למחוק את הקובץ?",
      okText: "מחק",
      cancelText: "ביטול",
      onOk: () => {
        deleteFile(fileId, {
          onSuccess: () => {
            queryClient.refetchQueries({ type: "active" });
            message.success("הקובץ נמחק בהצלחה");
          },
          onError: () => {
            message.error("שגיאה במחיקת הקובץ");
          },
        });
      },
    });
  };

  const handleDeleteFolder = (axis: AxisFolder) => {
    Modal.confirm({
      title: "מחיקת ציר",
      content: `האם אתה בטוח שברצונך למחוק את הציר "${axis.name}" וכל מה שבו?`,
      okText: "מחק",
      cancelText: "ביטול",
      onOk: () => {
        deleteFolder(axis.id, {
          onSuccess: () => {
            queryClient.refetchQueries({ type: "active" });
            message.success("הציר נמחק בהצלחה");
          },
          onError: () => {
            message.error("שגיאה במחיקת הציר");
          },
        });
      },
    });
  };

  const startEditFolder = (axis: AxisFolder) => {
    setEditingFolderId(axis.id);
    setEditFolderName(axis.name);
    setTimeout(() => editFolderInputRef.current?.focus(), 0);
  };

  const cancelEditFolder = () => {
    setEditingFolderId(null);
    setEditFolderName("");
  };

  const handleSaveEditFolder = () => {
    if (!editingFolderId || !editFolderName.trim()) return;
    updateFolder(
      { folderId: editingFolderId, name: editFolderName.trim() },
      {
        onSuccess: () => {
          setEditingFolderId(null);
          setEditFolderName("");
          queryClient.refetchQueries({ type: "active" });
          message.success("הציר עודכן בהצלחה");
        },
        onError: () => {
          message.error("שגיאה בעריכת הציר");
        },
      }
    );
  };

  const getAxisColor = (colorName: string): string => {
    const gradient = schemaMap[colorName as keyof typeof schemaMap];
    return gradient?.from || "#3A547F";
  };

  const getUserName = (user: UserInfo | undefined) => {
    if (!user) return "-";
    return user.name || user.username || "-";
  };

  const isImage = (type: string) => type?.startsWith("image/");
  const isPdf = (type: string) => type === "application/pdf";
  const canPreview = (file: any) => isImage(file.type) || isPdf(file.type);

  const getPreviewUrl = (file: FileData) => {
    const teamMemberQuery =
      isTeamMemberView && selectedTeamMember?.id
        ? `&teamMemberId=${selectedTeamMember.id}`
        : "";
    const teamQuery =
      !isTeamMemberView && selectedTeam?.id ? `&teamId=${selectedTeam.id}` : "";

    return `${
      process.env.REACT_APP_API_BASE_URL
    }/files/stream-file?bucket=${encodeURIComponent(
      file.s3BucketName
    )}&key=${encodeURIComponent(file.s3Key)}${teamMemberQuery}${teamQuery}`;
  };

  const getLatestFileInAxis = (axisFiles: FileData[]): FileData | null => {
    if (!axisFiles || axisFiles.length === 0) return null;
    return axisFiles.reduce((latest, file) => {
      const fileDate = new Date(file.createdAt).getTime();
      const latestDate = new Date(latest.createdAt).getTime();
      return fileDate > latestDate ? file : latest;
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === undefined || bytes === null) return "-";
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const isLoading = isLoadingFiles || isLoadingCustomFolders;

  const driveOwnerName = isTeamMemberView
    ? (selectedTeamMember as any)?.name ||
      (selectedTeamMember as any)?.User?.name ||
      (selectedTeamMember as any)?.username ||
      ""
    : (selectedTeam as any)?.name || "";

  const driveTitle = driveOwnerName ? `הדרייב של ${driveOwnerName}` : "דרייב";

  if (!selectedCourseBatch) {
    return (
      <div className={`${styles.container} ${styles.filesView}`}>
        <div className={styles.header}>
          <HeaderPermissionDisplay />
          <h2 className={styles.title}>שימור ידע</h2>
        </div>
        <div className="kr-empty-container">
          <Empty description="יש לבחור מחזור קורס" />
        </div>
      </div>
    );
  }

  if (!canEnterAxes) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <HeaderPermissionDisplay />
        </div>
        <div className={styles.tableWrapper}>
          <Empty description="יש לבחור צוות" />
        </div>
      </div>
    );
  }

  if (selectedAxisWithFiles) {
    const showCustomUpload = Boolean(selectedAxisWithFiles.isCustom);
    const allFilesList = [
      ...(selectedAxisWithFiles.files || []),
      ...(selectedAxisWithFiles.customFiles || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        s3Key: f.s3_key,
        s3BucketName: f.s3_bucket_name,
        createdAt: f.created_at,
        isPatbass: false,
        isCustomFile: true,
        fileObj: f,
        task: undefined,
      })),
    ] as any[];

    const handleRowDoubleClick = (file: any) => {
      if (canPreview(file)) {
        setPreviewFile(file);
      } else {
        handleDownload(file);
      }
    };

    return (
      <div className={`${styles.container} ${styles.filesView}`}>
        <div className={styles.header}>
          <HeaderPermissionDisplay />
        </div>

        <div className={styles.breadcrumb}>
          <div className={styles.breadcrumbPath}>
            <button
              className={styles.breadcrumbBtn}
              onClick={() => setSelectedAxis(null)}
            >
              <span>{driveTitle}</span>
            </button>
            <RightOutlined
              style={{
                color: "#999",
                transform: "rotate(180deg)",
                fontSize: 10,
              }}
            />
            <TruncatedText
              text={selectedAxisWithFiles.name}
              className={styles.breadcrumbCurrent}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <Spin size="large" />
            <span>טוען קבצים...</span>
          </div>
        ) : (
          <div
            className={`${styles.tableWrapper} ${
              showCustomUpload ? styles.tableCustom : styles.tableAxis
            }`}
          >
            <div className={styles.tableHeader}>
              <span className={styles.headerCell}>שם</span>
              <span className={styles.headerCell}>מי יצר</span>
              {!showCustomUpload && (
                <span className={styles.headerCell}>משויך למשימה</span>
              )}
              <span className={styles.headerCell}>גודל</span>
              <span className={styles.headerCell}>הועלה</span>
              <span className={styles.headerCell}></span>
            </div>
            <div className={styles.tableHeaderSeparator}></div>
            {allFilesList.length > 0 && (
              <div className={styles.filesList}>
                {allFilesList.map((file) => {
                  const fileIcon = getFileIconAndColor(file);
                  return (
                    <div
                      key={file.id}
                      className={styles.fileRow}
                      onDoubleClick={() => handleRowDoubleClick(file)}
                    >
                      <div className={styles.fileNameCell}>
                        <span
                          style={{
                            fontSize: 18,
                            color: fileIcon.color,
                            display: "inline-flex",
                          }}
                        >
                          {fileIcon.icon}
                        </span>
                        <TruncatedText
                          text={file.name}
                          className={styles.fileNameText}
                        />
                      </div>
                      <div className={styles.cell}>
                        <TruncatedText
                          text={
                            file.task?.User
                              ? getUserName(file.task.User)
                              : file.isCustomFile && file.fileObj?.creator
                              ? file.fileObj.creator.name ||
                                file.fileObj.creator.username ||
                                "-"
                              : "-"
                          }
                          className={styles.cellText}
                        />
                      </div>
                      {!showCustomUpload && (
                        <div className={styles.cell}>
                          <TruncatedText
                            text={file.task?.name || "-"}
                            className={styles.cellText}
                          />
                        </div>
                      )}
                      <div className={styles.cell}>
                        <span className={styles.cellText}>
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <div className={styles.cell}>
                        <span className={styles.cellText}>
                          {formatDate(file.createdAt)}
                        </span>
                      </div>
                      <div className={styles.rowActions}>
                        {canPreview(file) && (
                          <Tooltip title="צפייה">
                            <button
                              type="button"
                              className={styles.rowActionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                            >
                              <EyeOutlined />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip title="הורדה">
                          <button
                            type="button"
                            className={styles.rowActionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                          >
                            <DownloadOutlined />
                          </button>
                        </Tooltip>
                        {showCustomUpload && (
                          <Tooltip title="מחיקה">
                            <button
                              type="button"
                              className={styles.rowActionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomFile(file.id);
                              }}
                            >
                              <DeleteOutlined />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {showCustomUpload && (
          <div className={styles.uploadInline}>
            <Upload
              showUploadList={false}
              beforeUpload={handleFileUpload}
              accept="*"
            >
              <button
                type="button"
                className={styles.uploadCircleBtn}
                aria-label="העלה קובץ"
              >
                <PlusOutlined />
              </button>
            </Upload>
            {isUploading && <Progress percent={uploadProgress} size="small" />}
          </div>
        )}

        <Modal
          title={previewFile?.name}
          open={!!previewFile}
          onCancel={() => setPreviewFile(null)}
          footer={null}
          width={800}
          centered
          closeIcon={<CloseOutlined />}
        >
          {previewFile && (
            <div style={{ textAlign: "center" }}>
              {isImage(previewFile.type) && (
                <img
                  src={getPreviewUrl(previewFile)}
                  alt={previewFile.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              )}
              {isPdf(previewFile.type) && (
                <iframe
                  src={getPreviewUrl(previewFile)}
                  style={{ width: "100%", height: "70vh", border: "none" }}
                  title={previewFile.name}
                />
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <HeaderPermissionDisplay />
      </div>

      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbCurrent}>{driveTitle}</span>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Spin size="large" />
          <span>טוען צירים...</span>
        </div>
      ) : (
        <div className={`${styles.tableWrapper} ${styles.tableFolders}`}>
          <div className={styles.tableHeader}>
            <span className={styles.headerCell}>שם</span>
            <span className={styles.headerCell}>שינוי אחרון</span>
            <span className={styles.headerCell}></span>
          </div>
          <div className={styles.tableHeaderSeparator}></div>
          <div className={`${styles.filesList} ${styles.folderList}`}>
            {foldersWithFiles.map((axis) => {
              const latestFile = getLatestFileInAxis(axis.files);
              return (
                <div
                  key={axis.id}
                  className={styles.fileRow}
                  onClick={() => {
                    if (editingFolderId !== null) return;
                    setSelectedAxis(axis);
                  }}
                >
                  <div className={styles.fileNameCell}>
                    <FolderFilled
                      style={{ fontSize: 18, color: getAxisColor(axis.color) }}
                    />
                    {editingFolderId === axis.id ? (
                      <>
                        <Input
                          ref={editFolderInputRef}
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          onPressEnter={handleSaveEditFolder}
                          bordered={false}
                          style={{ padding: 0, fontSize: 14, flex: 1 }}
                        />
                        <Tooltip title="אישור">
                          <button
                            type="button"
                            className={styles.confirmFolderBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEditFolder();
                            }}
                            disabled={!editFolderName.trim() || isUpdating}
                          >
                            <CheckOutlined />
                          </button>
                        </Tooltip>
                        <Tooltip title="ביטול">
                          <button
                            type="button"
                            className={styles.cancelFolderBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditFolder();
                            }}
                          >
                            <CloseOutlined />
                          </button>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <TruncatedText
                          text={axis.name}
                          className={styles.fileNameText}
                        />
                        <span className={styles.folderCount}>
                          (
                          {axis.isCustom ? (
                            <CustomFolderFileCount
                              folderId={axis.id}
                              useFolderFiles={useFolderFiles}
                            />
                          ) : (
                            axis.files.length
                          )}
                          )
                        </span>
                      </>
                    )}
                  </div>
                  <div className={styles.cell}>
                    <span className={styles.cellText}>
                      {axis.isCustom ? (
                        <CustomFolderLatestDate
                          folderId={axis.id}
                          useFolderFiles={useFolderFiles}
                        />
                      ) : latestFile ? (
                        formatDate(latestFile.createdAt)
                      ) : (
                        "-"
                      )}
                    </span>
                  </div>
                  <div className={styles.folderActions}>
                    {axis.isCustom && (
                      <>
                        <Tooltip title="ערוך ציר">
                          <button
                            type="button"
                            className={styles.editFolderBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditFolder(axis);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <EditOutlined />
                          </button>
                        </Tooltip>
                        <Tooltip title="מחק ציר">
                          <button
                            type="button"
                            className={styles.deleteFolderBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(axis);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <DeleteOutlined />
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {isAddingFolder && (
              <div className={`${styles.fileRow} ${styles.newFolderRow}`}>
                <div className={styles.fileNameCell}>
                  <FolderFilled style={{ fontSize: 18, color: "#3A547F" }} />
                  <Input
                    ref={newFolderInputRef}
                    placeholder="הקלד שם..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onPressEnter={handleCreateFolder}
                    bordered={false}
                    style={{ padding: 0, fontSize: 14 }}
                  />
                  <Tooltip title="אישור">
                    <button
                      type="button"
                      className={styles.confirmFolderBtn}
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || isCreating}
                    >
                      <CheckOutlined />
                    </button>
                  </Tooltip>
                  <Tooltip title="ביטול">
                    <button
                      type="button"
                      className={styles.cancelFolderBtn}
                      onClick={handleCancelAddFolder}
                    >
                      <CloseOutlined />
                    </button>
                  </Tooltip>
                </div>
                <div className={styles.cell}>
                  <span className={styles.cellText}>-</span>
                </div>
                <div className={styles.folderActions}></div>
              </div>
            )}
          </div>
        </div>
      )}

      <Tooltip title="הוספת תיקייה">
        <button
          type="button"
          className={styles.addFolderBtn}
          onClick={() => setIsAddingFolder(true)}
          aria-label="הוסף תיקייה"
        >
          <PlusOutlined />
        </button>
      </Tooltip>
    </div>
  );
};

export default KnowledgeRetention;
