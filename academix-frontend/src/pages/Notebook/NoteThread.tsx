// Replies of the open note + "add reply" (split out of Notebook.tsx, issue #125).
import React from "react";
import { Button, Typography } from "antd";
import { ClockCircleOutlined, CloseOutlined, FileTextOutlined, PlusOutlined } from "@ant-design/icons";
import styles from "./Notebook.module.css";
import NoteEditor from "./NoteEditor/NoteEditor";
import { formatNoteDate, Note, noteLastUpdated } from "./notebookTypes";

type SaveFn = (title: string, content: any) => Promise<boolean>;

type Props = {
  note: Note;
  folderName?: string;
  isNewNote: boolean;
  editingReplyId: number | null;
  setEditingReplyId: (id: number | null) => void;
  isAddingReply: boolean;
  setIsAddingReply: (adding: boolean) => void;
  canEditReply: (reply: Note) => boolean;
  onSaveReply: (reply: Note) => SaveFn;
  onCreateReply: SaveFn;
};

export default function NoteThread({
  note,
  folderName,
  isNewNote,
  editingReplyId,
  setEditingReplyId,
  isAddingReply,
  setIsAddingReply,
  canEditReply,
  onSaveReply,
  onCreateReply,
}: Props) {
  return (
    <div className={styles.threadPanel}>
      {note.replies?.length > 0 && (
        <div className={styles.threadReplies}>
          {note.replies.map((reply) => {
            const replyUpdated = noteLastUpdated(reply);
            const isReplyOpen = editingReplyId === reply.id;

            return (
              <div key={reply.id} className={styles.threadReplyItem}>
                {/* הכרטיסייה – לחיצה פותחת/סוגרת */}
                <div
                  className={`${styles.threadReplyCard} ${
                    isReplyOpen ? styles.threadReplyCardOpen : ""
                  }`}
                  onClick={() => setEditingReplyId(isReplyOpen ? null : reply.id)}
                >
                  <div className={styles.threadReplyContent}>
                    <FileTextOutlined className={styles.threadReplyIcon} />
                    <Typography.Text strong className={styles.threadReplyTitle}>
                      {reply.title || "ללא כותרת"}
                    </Typography.Text>
                  </div>

                  {replyUpdated && (
                    <div className={styles.threadReplyFooter}>
                      <ClockCircleOutlined className={styles.threadReplyDateIcon} />
                      <Typography.Text type="secondary" className={styles.threadReplyDate}>
                        {formatNoteDate(replyUpdated)}
                      </Typography.Text>
                    </div>
                  )}
                </div>

                {/* אם פתוחה – מציגים עורך מתחת */}
                {isReplyOpen && (
                  <div className={styles.threadReplyEditorWrapper}>
                    <NoteEditor
                      key={reply.id}
                      folderName={folderName}
                      initialTitle={reply.title}
                      initialContent={reply.content}
                      initialMode={isNewNote ? "edit" : "view"}
                      creatorName={reply?.creator?.name}
                      canEdit={canEditReply(reply)}
                      onBack={() => setEditingReplyId(null)}
                      onSave={onSaveReply(reply)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {note.id !== 0 && (
        <div className={styles.newReplySection}>
          {isAddingReply ? (
            <div className={styles.newReplyEditorContainer}>
              <div className={styles.newReplyEditorActions}>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => setIsAddingReply(false)}
                  className={styles.cancelNewReplyButton}
                >
                  ביטול הוספת תגובה
                </Button>
              </div>

              <NoteEditor
                key="new-reply"
                folderName={folderName}
                initialTitle=""
                initialMode={isNewNote ? "edit" : "view"}
                canEdit={true}
                initialContent={null}
                isAddingResponse={true}
                onBack={() => setIsAddingReply(false)}
                onSave={onCreateReply}
              />
            </div>
          ) : (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={() => {
                setIsAddingReply(true);
                setEditingReplyId(null); // סגירת עורך תגובה פתוח
              }}
            >
              הוסף תגובה חדשה
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
