import style from "./FormGrade.module.css";
import { Button, ConfigProvider, Input, InputRef, Select, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { usePermissionStore } from "../../store/permissionStore";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import {
  getFormSubmissionsAnswers,
  putFormSubmission,
  putFormSubmissionsAnswer,
} from "../../services/ApiServices";
import Notification from "../Notification/Notification";
import { queryClient } from "../../api/queryClient";
import { useSearchParams } from "react-router-dom";

interface Comments {
  height?: string;
  width?: string;
  props?: any;
  trigger?: any;
  setTrigger?: any;
}

const FormGrade = (props: Comments) => {
  const { permissions } = usePermissionStore();
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>("");
  const [gradeValue, setGradeValue] = useState<number | null>(null);

  const inputRef = useRef<InputRef | null>(null);
  const [searchParams] = useSearchParams();
  const isSurvey = searchParams.get("isSurvey");

  const q = props?.props;
  const isAnswer = q?.renderFor === "answer";
  const submission = Array.isArray(q?.submission)
    ? q?.submission?.[0] ?? {}
    : q?.submission ?? {};

  useEffect(() => {
    if (!isAnswer) {
      setNoteText(submission?.instructor_note || "");
      setGradeValue(
        q?.formData?.find((a: any) => a.form_question_id === q?.questionId)
          ?.pointEarned ?? submission?.pointEarned
      );
    }
  }, [JSON.stringify(submission)]);

  /* ---------- toggle input note ---------- */
  const handleToggleOpenNoteInput = (fromCancel?: boolean) => {
    setShowCommentInput((prev) => !prev);
    if (fromCancel) setNoteText(submission?.instructor_note || "");
    setTimeout(() => inputRef.current?.focus(), 1);
  };

  /* ---------- save note ---------- */
  const handleSaveNote = (text: string, noToggle?: boolean) => {
    if (!noToggle) setShowCommentInput((prev) => !prev);
    setNoteText(text);

    q?.setFormData((prev: any) => {
      const existingIndex = prev.findIndex(
        (item: any) => item.form_question_id === q.questionId
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          instructor_note: text,
        };
        return updated;
      }
      return [
        ...prev,
        {
          form_submission_id: submission?.form_submission_id,
          form_question_id: q?.questionId,
          instructor_note: text,
        },
      ];
    });
  };

  /* ---------- select grade ---------- */
  const handleSelectGrade = (value: number) => {
    setGradeValue(value);
    q?.setFormData((prev: any) => {
      const existingIndex = prev.findIndex(
        (item: any) => item.form_question_id === q.questionId
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          pointEarned: value,
        };
        return updated;
      }
      return [
        ...prev,
        {
          form_submission_id: submission?.form_submission_id,
          form_question_id: q?.questionId,
          pointEarned: value,
        },
      ];
    });
  };

  /* ---------- save all + close ---------- */
  const handleUpdateAndClose = async () => {
    if (q?.formData) {
      try {
        const existingAnswers = await getFormSubmissionsAnswers(
          q?.formSubmissionId
        );

        q?.formData.forEach((newAnswer: any) => {
          const existingIndex = existingAnswers.findIndex(
            (existing: any) =>
              existing.form_question_id === newAnswer.form_question_id
          );
          if (existingIndex >= 0) {
            existingAnswers[existingIndex] = {
              ...existingAnswers[existingIndex],
              pointEarned:
                newAnswer.pointEarned !== undefined
                  ? newAnswer.pointEarned
                  : existingAnswers[existingIndex].pointEarned,
              instructor_note:
                newAnswer.instructor_note !== undefined
                  ? newAnswer.instructor_note
                  : existingAnswers[existingIndex].instructor_note,
            };
          }
        });

        const totalScore = existingAnswers.reduce(
          (sum: number, item: any) => sum + (item.pointEarned || 0),
          0
        );

        await putFormSubmission({ score: totalScore }, q?.formSubmissionId);

        const responses = await Promise.all(
          q?.formData.map((answer: any) =>
            putFormSubmissionsAnswer(answer, q?.formSubmissionId)
          )
        );

        if (responses.every((r) => r.status === 201 || r.status === 200)) {
          Notification({ type: "success", msg: "השינוי נשמר בהצלחה!" });
        }

        queryClient.refetchQueries({ queryKey: ["form"] });
        queryClient.refetchQueries({ queryKey: ["UsersInTeamAndTask"] });
      } catch (error) {
        Notification({ type: "error", msg: "שמירת המבחן נכשלה" });
      }
    }
    props?.setTrigger?.(!props?.trigger);
  };

  const getPopupContainer = (triggerNode: HTMLElement) =>
    triggerNode.parentElement!;

  if (isSurvey) return <></>;

  const canEdit =
    permissions?.[0]?.role_code !== "STUDENT" &&
    permissions?.[0]?.role_code !== "OVERLAP";
  const points = q?.points ?? 0;
  const gradeOptions = Array.from({ length: points + 1 }, (_, i) => i);

  return (
    <div className={style.container}>
      <div className={style.gradeRow}>
        <Select
          className={style.select}
          value={gradeValue}
          onSelect={handleSelectGrade}
          placeholder="בחר ציון"
          getPopupContainer={getPopupContainer}
          popupMatchSelectWidth={false}
        >
          {gradeOptions.map((i) => (
            <Select.Option key={i} value={i}>
              {i}
            </Select.Option>
          ))}
        </Select>
        <span className={style.outOf}>מתוך {points}</span>
      </div>

      <div className={style.noteRow}>
        {showCommentInput ? (
          <Input
            className={style.noteInput}
            ref={inputRef}
            placeholder="כאן רושמים את ההערה..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNote(noteText);
            }}
            onBlur={() => handleSaveNote(noteText, true)}
            autoFocus
          />
        ) : noteText?.trim() ? (
          <div className={style.noteDisplay}>
            <span className={style.noteLabel}>הערת הבודק/ת:</span>
            <Tooltip color="gray" title={noteText.length >= 80 ? noteText : ""}>
              <span
                className={style.noteText}
                onClick={() => handleToggleOpenNoteInput()}
              >
                {noteText.length >= 80
                  ? `${noteText.substring(0, 74)}...`
                  : noteText}
              </span>
            </Tooltip>
          </div>
        ) : (
          <button
            type="button"
            className={style.addNote}
            onClick={() => handleToggleOpenNoteInput()}
          >
            + הוספת הערה
          </button>
        )}
      </div>

      {canEdit && props?.trigger && !showCommentInput && (
        <div className={style.actions}>
          <button
            type="button"
            className={`${style.actionBtn} ${style.saveBtn}`}
            onClick={handleUpdateAndClose}
          >
            <CheckOutlined /> שמירה
          </button>
          <button
            type="button"
            className={`${style.actionBtn} ${style.cancelBtn}`}
            onClick={() => props?.setTrigger?.(!props?.trigger)}
          >
            <CloseOutlined /> ביטול
          </button>
        </div>
      )}
    </div>
  );
};

export default FormGrade;
