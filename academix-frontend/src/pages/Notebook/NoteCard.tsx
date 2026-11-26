// One note card in the Notebook grid (split out of Notebook.tsx, issue #125).
import React from "react";
import { Card, Popconfirm, Typography } from "antd";
import {
  ClockCircleOutlined,
  DeleteFilled,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import styles from "./Notebook.module.css";
import { formatNoteDate, Note, noteLastUpdated } from "./notebookTypes";

type Props = {
  note: Note;
  selected: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onDelete: () => void;
};

export default function NoteCard({ note, selected, canDelete, onOpen, onDelete }: Props) {
  const lastUpdated = noteLastUpdated(note);

  return (
    <Card
      onClick={onOpen}
      hoverable
      size="small"
      className={`${styles.noteCard} ${selected ? styles.noteCardSelected : ""}`}
      styles={{ body: { padding: 0 } }}
    >
      <div className={styles.noteCardTopBar} />
      <div className={styles.noteCardBody}>
        <FileTextOutlined className={styles.noteCardIcon} />
        <Typography.Text strong className={styles.noteCardTitle}>
          {note.title || "ללא כותרת"}
        </Typography.Text>
      </div>
      {lastUpdated && (
        <div className={styles.noteCardFooter}>
          <ClockCircleOutlined className={styles.noteCardDateIcon} />
          <Typography.Text type="secondary" className={styles.noteCardDate}>
            {formatNoteDate(lastUpdated)}
          </Typography.Text>
          {note?.creator?.name && (
            <div className={styles.noteCardCreator}>
              <UserOutlined />
              <Typography.Text type="secondary" className={styles.noteCardCreatorName}>
                {note?.creator?.name}
              </Typography.Text>
            </div>
          )}
          {canDelete && (
            <div className={styles.noteCardDeleteWrapper} onClick={(e) => e.stopPropagation()}>
              <Popconfirm
                title="מחיקת פתק"
                description="הפתק וכל התגובות שלו יימחקו. להמשיך?"
                onConfirm={onDelete}
                okText="מחק"
                cancelText="ביטול"
                okButtonProps={{ danger: true }}
              >
                <DeleteFilled className={styles.noteCardDeleteIcon} />
              </Popconfirm>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
