// Folders panel of the Notebook page (split out of Notebook.tsx, issue #125).
import React from "react";
import { Alert, Button, Empty, List, Popconfirm, Spin, Tooltip, Typography } from "antd";
import { DeleteFilled, FolderOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import styles from "./Notebook.module.css";
import { Folder } from "./notebookTypes";

type Props = {
  folders: Folder[];
  loading: boolean;
  error: string | null;
  selectedFolderId: number | null;
  canDeleteFolder: (folder: Folder) => boolean;
  onAddFolder: () => void;
  onFolderClick: (folderId: number) => void;
  onDeleteFolder: (folderId: number) => void;
};

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export default function FolderList({
  folders,
  loading,
  error,
  selectedFolderId,
  canDeleteFolder,
  onAddFolder,
  onFolderClick,
  onDeleteFolder,
}: Props) {
  const renderFolderItem = (folder: Folder) => {
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cx(styles.folderItem, isSelected && styles.folderItemSelected)}
          onClick={() => onFolderClick(folder.id)}
        >
          <span className={cx(styles.ellipse, isSelected && styles.ellipseSelected)}>
            <FolderOutlined
              className={cx(styles.ellipseIcon, isSelected && styles.ellipseIconSelected)}
            />
          </span>

          <span className={cx(styles.folderName, isSelected && styles.folderNameSelected)}>
            {folder.name}
          </span>

          {/* אייקון לתיקייה משותפת */}
          {folder.system_key == "system" && (
            <Tooltip title="התיקייה משותפת לכל הצוות- הפתקים חשופים לכל מי שבצוות ">
              <TeamOutlined className={styles.sharedFolderIcon} />
            </Tooltip>
          )}

          <div className={styles.deleteWrapper} onClick={(e) => e.stopPropagation()}>
            {canDeleteFolder(folder) && (
              <Popconfirm
                title="מחיקת תיקייה"
                description="התיקייה וכל הפתקים שבה יימחקו. להמשיך?"
                onConfirm={() => onDeleteFolder(folder.id)}
                okText="מחק"
                cancelText="ביטול"
                okButtonProps={{ danger: true }}
              >
                <DeleteFilled className={styles.deleteIcon} />
              </Popconfirm>
            )}
          </div>
        </div>

        {folder.children?.length ? (
          <div className={styles.folderChildren}>{folder.children.map(renderFolderItem)}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={styles.foldersPanel}>
      <Typography.Text strong className={styles.foldersTitle}>
        תיקיות
      </Typography.Text>
      <Button
        type="text"
        icon={<PlusOutlined />}
        onClick={onAddFolder}
        className={styles.addFolderButton}
      />
      {loading ? (
        <div className={styles.spinWrapper}>
          <Spin />
        </div>
      ) : error ? (
        <Alert type="error" message={error} showIcon />
      ) : folders.length === 0 ? (
        <Empty description="אין תיקיות" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List size="small" dataSource={folders} renderItem={renderFolderItem} split={false} />
      )}
    </div>
  );
}
