import React, { useState, useEffect } from "react";
import { Input, Button, message } from "antd";
import { CheckOutlined, CloseOutlined, LockOutlined } from "@ant-design/icons";
import axios from "axios";

interface NoteForStudentProps {
  taskAssignmentId: number;
  initialNote?: string;
  onNoteChange?: (note: string) => void;
  isStudent?: boolean;
}

const NoteForStudent: React.FC<NoteForStudentProps> = ({
  taskAssignmentId,
  initialNote,
  onNoteChange,
  isStudent = false,
}) => {
  const [note, setNote] = useState<string>("");
  const [initialLoadedNote, setInitialLoadedNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // console.log(taskAssignmentId);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/task-assignments/note/${taskAssignmentId}`
        );

        const fetchedNote = response.data.note_for_student || "";
        setNote(fetchedNote);
        setInitialLoadedNote(fetchedNote);

        if (initialNote !== undefined) {
          setNote(initialNote);
          setInitialLoadedNote(initialNote);
        }

        onNoteChange?.(fetchedNote);
      } catch (error) {
        console.error("Error fetching note:", error);
        if (initialNote !== undefined) {
          setNote(initialNote);
          setInitialLoadedNote(initialNote);
        }
      }
    };

    if (taskAssignmentId) {
      fetchNote();
    }
  }, [taskAssignmentId]);

  useEffect(() => {
    setHasChanges(note !== initialLoadedNote);
  }, [note, initialLoadedNote]);

  const handleSave = async () => {
    if (!note.trim()) {
      message.warning("לא ניתן לשמור הערה ריקה");
      return;
    }

    setIsLoading(true);
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/task-assignments/note/${taskAssignmentId}`,
        {
          note_for_student: note.trim(),
        }
      );

      message.success("ההערה נשמרה בהצלחה");
      setInitialLoadedNote(note);
      setHasChanges(false);
      onNoteChange?.(note);
    } catch (error) {
      console.error("Error saving note:", error);
      message.error("נא בחר חניך!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/task-assignments/note/${taskAssignmentId}`,
        {
          note_for_student: null,
        }
      );

      message.success("ההערה נמחקה");
      setNote("");
      setInitialLoadedNote("");
      setHasChanges(false);
      onNoteChange?.("");
    } catch (error) {
      console.error("Error deleting note:", error);
      message.error("שגיאה במחיקת ההערה");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  const hasNote = note && note.trim().length > 0;

  if (isStudent && !hasNote) {
    return null;
  }

  const isDisabled = isLoading || isDeleting;
  const showEditControls = !isStudent;

  if (isStudent && hasNote) {
    return (
      <div
        style={{
          direction: "rtl",
          textAlign: "right",
        }}
      >
        <div
          style={{
            fontSize: "0.93rem",
            fontWeight: 600,
            color: "#9ea3a8",
            marginBottom: "4px",
          }}
        >
          הערת חופף :
        </div>

        <div
          style={{
            fontSize: "0.95rem",
            color: "#333",
            padding: "8px 0",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap", // שמירה על ירידות שורה
            userSelect: "text", // מאפשר סימון והעתקה
          }}
        >
          {note}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        direction: "rtl",
      }}
    >
      {taskAssignmentId ? (
        <>
          <Input.TextArea
            name="note_for_student"
            placeholder={showEditControls ? "הוסף הערה לחניך..." : "אין הערה"}
            value={note}
            onChange={handleChange}
            readOnly={isStudent}
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{
              padding: showEditControls ? "0.6rem 1rem 0.6rem 4rem" : "0.6rem",
              borderRadius: "20px",
              border:
                hasChanges && showEditControls
                  ? "2px solid #1890ff"
                  : "1px solid #d9d9d9",
              transition: "border-color 0.3s ease",
              backgroundColor: isStudent ? "#f5f5f5" : "#fff",
              cursor: isStudent ? "not-allowed" : "text",
            }}
            disabled={isDisabled || isStudent}
          />

          {showEditControls && (
            <>
              <Button
                type="primary"
                shape="circle"
                icon={<CheckOutlined />}
                size="small"
                loading={isLoading}
                onClick={handleSave}
                disabled={!hasChanges || !note.trim()}
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "calc(10% + 12px)",
                  transform: "translateY(-50%)",
                  backgroundColor: hasChanges ? "#52c41a" : "#d9d9d9",
                  borderColor: hasChanges ? "#52c41a" : "#d9d9d9",
                  opacity: hasChanges ? 1 : 0.6,
                  transition: "all 0.3s ease",
                }}
              />

              <Button
                type="primary"
                danger
                shape="circle"
                icon={<CloseOutlined />}
                size="small"
                loading={isDeleting}
                onClick={handleDelete}
                disabled={!hasNote || isDisabled}
                style={{
                  position: "absolute",
                  left: "42px",
                  top: "calc(10% + 12px)",
                  transform: "translateY(-50%)",
                }}
              />
            </>
          )}
        </>
      ) : null}
    </div>
  );
};

export default NoteForStudent;
