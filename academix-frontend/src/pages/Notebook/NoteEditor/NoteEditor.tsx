// components/NoteBook/NoteEditor.tsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";

import { Button, Typography, message, Spin } from "antd";
import {
  SaveOutlined,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import styles from "./NoteEditor.module.css";
import { usePermissionStore } from "../../../store/permissionStore";

interface QuillDelta {
  ops?: any[];
}

interface NoteEditorProps {
  folderName?: string;
  initialTitle: string;
  creatorName?: string;
  canEdit?: boolean;
  isAddingResponse?: boolean;
  initialContent?: QuillDelta | null;
  initialMode?: "view" | "edit";
  onBack?: () => void;
  onSave?: (title: string, content: QuillDelta) => Promise<boolean> | boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  folderName,
  creatorName,
  initialTitle,
  canEdit = true,
  initialContent,
  initialMode = "view",
  isAddingResponse=false,
  onBack,
  onSave,
}) => {
  const [isEditMode, setIsEditMode] = useState(initialMode === "edit");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<QuillDelta>(
    initialContent && Array.isArray(initialContent.ops)
      ? initialContent
      : { ops: [] }
  );
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const quillRef = useRef<any>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title, content });
  latestRef.current = { title, content };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }, "clearColor", "clearBg"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          [{ script: "sub" }, { script: "super" }],
          ["blockquote", "code-block"],
          ["link"],
          [{ direction: "rtl" }, { direction: "ltr" }],
          ["clean"],
        ],
        handlers: {
          clearColor(this: any) {
            this.quill.format("color", false);
          },
          clearBg(this: any) {
            this.quill.format("background", false);
          },
        },
      },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "align",
    "script",
    "blockquote",
    "code-block",
    "link",
    "direction",
  ];

  const performSave = async (t: string, c: QuillDelta) => {
    setSaving(true);
    try {
      const ok = await onSave?.(t, c);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
      if (ok === false) message.error("שמירה נכשלה");
      else setIsEditMode(false); // חזרה למצב תצוגה אחרי שמירה מוצלחת
    } finally {
      setSaving(false);
    }
  };

  const quillOnChange = useCallback(
    (_value: string, _delta: any, source: any, editor: any) => {
      if (source !== "user") return;
      const fullContent = editor.getContents();
      setContent({ ops: fullContent?.ops || [] });
    },
    []
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // המרה מ-Delta ל-HTML להצגה יפה
  const convertDeltaToHTML = useCallback((delta: QuillDelta): string => {
    if (!delta?.ops) return "";
    try {
      const tempDiv = document.createElement("div");
      const quill = new Quill(tempDiv);
      quill.setContents(delta as any);
      return quill.root.innerHTML;
    } catch {
      return "";
    }
  }, []);

  const editorValue = useMemo(() => content, [content]);
  const viewHTML = useMemo(() => convertDeltaToHTML(content), [content, convertDeltaToHTML]);

  if (!mounted) return null;

  return (
    <div className={styles.noteEditor}>
      <div className={styles.noteEditorHeader} />

      {creatorName && (
        <div className={styles.noteEditorCreator}>
          <UserOutlined />
          <Typography.Text type="secondary" className={styles.noteEditorCreatorName}>
            {creatorName}
          </Typography.Text>
        </div>
      )}

      {!isEditMode && !isAddingResponse ? (
        // ═══════════════ מצב תצוגה ═══════════════
        <div className={styles.noteView}>
          <Typography.Title level={3} className={styles.noteViewTitle}>
            {title || "ללא כותרת"}
          </Typography.Title>

          {viewHTML ? (
            <div
              className={styles.noteViewContent}
              dangerouslySetInnerHTML={{ __html: viewHTML }}
            />
          ) : (
            <Typography.Text type="secondary" className={styles.noteViewEmpty}>
              הפתק ריק
            </Typography.Text>
          )}

          {canEdit && (
            <div className={styles.noteViewActions}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditMode(true)}
                className={styles.editNoteButton}
              >
                ערוך
              </Button>
            </div>
          )}
        </div>
      ) : (
        // ═══════════════ מצב עריכה ═══════════════
        <>
          <input
            className={styles.noteTitleInput}
            value={title}
            placeholder="כותרת הפתק..."
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />

          <div className={styles.quillWrapper} dir="rtl">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={editorValue as any}
              onChange={quillOnChange}
              modules={modules}
              formats={formats}
              placeholder="כתוב כאן..."
            />
          </div>

          <div className={styles.noteEditorActions}>
            {saving ? (
              <Spin size="small" />
            ) : justSaved ? (
              <Typography.Text type="success">
                <CheckOutlined /> נשמר
              </Typography.Text>
            ) : null}

            {onBack && (
              <Button icon={<CloseOutlined />} onClick={onBack}>
                ביטול
              </Button>
            )}
      {
canEdit && !isAddingResponse &&
        <Button icon={<EyeOutlined />} onClick={() => setIsEditMode(false)}>
    תצוגה
  </Button>
      }
            {canEdit && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => performSave(title, content)}
                className={styles.saveNoteButton}
              >
                שמור
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NoteEditor;