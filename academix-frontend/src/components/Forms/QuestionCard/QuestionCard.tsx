import React, { useRef, useState, useEffect } from "react";
import style from "./QuestionCard.module.css";
import { Question, QuestionType } from "../../../types/types";
import { Input, Tooltip } from "antd";

type Props = {
  children: React.ReactNode;
  className?: string;
  onDuplicate?: (index: number) => void;
  onDelete?: () => void;
  question: Question;
  questionIndex: number;
  isSurveyPage: boolean;

  isDraggableQuestions: boolean;
  setIsDraggableQustions: React.Dispatch<React.SetStateAction<boolean>>;
  autoGrade: boolean;
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
};

const QuestionCard = ({
  children,
  className = "",
  onDuplicate,
  onDelete,
  question,
  questionIndex,
  isSurveyPage,

  isDraggableQuestions,
  setIsDraggableQustions,
  autoGrade,
  setQuestionsForEdit,
}: Props) => {
  const questionIndexRef = useRef(questionIndex);
  const setQuestionsForEditRef = useRef(setQuestionsForEdit);

  // Synchronise les refs avec les props à chaque render
  useEffect(() => {
    questionIndexRef.current = questionIndex;
  }, [questionIndex]);

  useEffect(() => {
    setQuestionsForEditRef.current = setQuestionsForEdit;
  }, [setQuestionsForEdit]);

  // --- État du drag ---
  const dragIndexRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const rafRef = useRef<number | null>(null);

  /* ---------- Auto-scroll aux bords ---------- */
  const stopAutoScroll = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const autoScroll = (clientY: number) => {
    const viewportHeight = window.innerHeight;
    const threshold = 120; // zone large pour un déclenchement progressif
    const maxSpeed = 15;

    let speed = 0;
    if (clientY < threshold) {
      speed = -Math.min(maxSpeed, (threshold - clientY) * 0.3);
    } else if (clientY > viewportHeight - threshold) {
      speed = Math.min(
        maxSpeed,
        (clientY - (viewportHeight - threshold)) * 0.3
      );
    }

    if (speed !== 0) {
      window.scrollBy(0, speed);
      rafRef.current = requestAnimationFrame(() => autoScroll(clientY));
    } else {
      stopAutoScroll();
    }
  };

  const handleAutoScroll = (clientY: number) => {
    stopAutoScroll();
    autoScroll(clientY);
  };

  /* ---------- Écouteurs globaux (montés une seule fois) ---------- */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!startPosRef.current) return;

      // 1. Vérifier le seuil de déclenchement du drag
      if (dragIndexRef.current === null) {
        const dx = Math.abs(e.clientX - startPosRef.current.x);
        const dy = Math.abs(e.clientY - startPosRef.current.y);
        if (Math.sqrt(dx * dx + dy * dy) < 5) return;

        // Début du drag
        dragIndexRef.current = questionIndexRef.current;
        setDragging(true);
        setIsDraggableQustions(true);
      }

      const fromIndex = dragIndexRef.current;
      if (fromIndex === null) return;

      // 2. Auto-scroll si on approche du bord
      handleAutoScroll(e.clientY);

      // 3. Réordonner en direct
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const overElement = elements.find((el) =>
        el.closest?.("[data-question-index]")
      ) as HTMLElement | undefined;

      if (!overElement) return;

      const targetIndex = Number(
        overElement
          .closest("[data-question-index]")
          ?.getAttribute("data-question-index")
      );

      if (isNaN(targetIndex) || targetIndex === fromIndex) return;

      setQuestionsForEditRef.current((prev) => {
        const questions = [...prev.questions];
        if (fromIndex < 0 || fromIndex >= questions.length) return prev;
        if (targetIndex < 0 || targetIndex >= questions.length) return prev;

        const [moved] = questions.splice(fromIndex, 1);
        questions.splice(targetIndex, 0, moved);

        dragIndexRef.current = targetIndex;
        return { questions };
      });
    };

    const handleMouseUp = () => {
      if (dragIndexRef.current !== null) {
        dragIndexRef.current = null;
        setDragging(false);
        stopAutoScroll();
        setIsDraggableQustions(false);
      }
      startPosRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      stopAutoScroll();
    };
  }, []); // Les refs rendent ce useEffect stable

  /* ---------- Démarrage du drag sur la carte ---------- */
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggableQuestions) return;

    const target = e.target as HTMLElement;
    if (target.closest("button, input, textarea, select, [contenteditable]")) {
      return;
    }

    e.preventDefault(); // évite la sélection de texte

    startPosRef.current = { x: e.clientX, y: e.clientY };
    dragIndexRef.current = null;
    setDragging(false);
  };

  /* ---------- Gestion du score ---------- */
  const handleScoreChange = (score: number) => {
    setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, index) =>
        index === questionIndex ? { ...q, points: score } : q
      ),
    }));
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      data-question-index={questionIndex}
      className={`${style["create-form"]} ${className} ${
        isDraggableQuestions && style["draggableQuestion"]
      } ${dragging ? style["dragging"] : ""}`}
    >
      <div>{children}</div>
      <div className={style["card-actions"]}>
        {!isSurveyPage && question.type !== "description" && (
          <div className={style["score-container"]}>
            <Input
              style={{
                width: "3vw",
                height: "3vh",
                borderRadius: "15px",
                border: "4px solid black",
                padding: "0",
                fontSize: "11px",
                fontWeight: "500",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(24, 144, 255, 0.1)",
              }}
              disabled={autoGrade}
              placeholder="ציון"
              value={question.points?.toString() || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d+$/.test(value)) {
                  handleScoreChange(parseInt(value));
                }
              }}
              type="number"
            />
            <span>נקודות</span>
          </div>
        )}
        <div className={style["button-container"]}>
          {onDuplicate && (
            <Tooltip title="שכפל שאלה">
              <button
                onClick={() => onDuplicate(questionIndex)}
                className={style["action-button"]}
                aria-label="Duplicate"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="מחק שאלה">
              <button
                onClick={onDelete}
                className={style["action-button"]}
                aria-label="Delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
