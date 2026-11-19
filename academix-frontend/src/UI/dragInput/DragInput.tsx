import React, { useEffect, useRef, useState } from "react";
import {
  CaretLeftFilled,
  CaretRightFilled,
  CloseOutlined,
} from "@ant-design/icons";
import style from "./dragInput.module.css";
import { QuestionType } from "../../types/types";

type FieldType = {
  id: number;
  text: string;
  type: "not-changeable" | "changeable";
  isEditable?: boolean;
};

type Props = {
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  editMissingWord?: boolean;
  questionIndex: number;
  question: any;
};

/* ✅ Détecte le mot initialement marqué `_mot_` (chargement BD / édition) */
const getInitialState = (
  question: any
): { words: string[]; markedIndex: number } => {
  const fields = Array.isArray(question?.fields) ? question.fields : [];

  if (fields.length > 0) {
    let markedIndex = 0;
    const words = fields.map((f: any, i: number) => {
      const raw = typeof f === "string" ? f : f?.text ?? "";
      if (/^_.*_$/.test(raw.trim())) markedIndex = i; // mot déjà masqué
      return raw.replaceAll("_", "");
    });
    return { words, markedIndex };
  }

  if (typeof question?.text === "string" && question.text.length > 0) {
    const rawWords = question.text.trim().split(/\s+/);
    let markedIndex = 0;
    const words = rawWords.map((w: any, i: any) => {
      if (/^_.*_$/.test(w)) {
        markedIndex = i;
        return w.replaceAll("_", "");
      }
      return w;
    });
    return { words, markedIndex };
  }

  return { words: [], markedIndex: 0 };
};

const DragInput = ({ setQuestionsForEdit, questionIndex, question }: Props) => {
  const init = getInitialState(question);

  const [editValue, setEditValue] = useState<string>("");
  const [order, setOrder] = useState<string[]>(init.words);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number>(
    init.markedIndex
  );
  const skipSyncRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* ✅ Resync quand la question change (reset / changement de type) */
  useEffect(() => {
    const next = getInitialState(question);
    skipSyncRef.current = true;
    setOrder(next.words);
    setSelectedWordIndex(next.markedIndex);
    skipSyncRef.current = false;
  }, [question?.id, question?.type]);

  /* ✅ Synchronise le store à CHAQUE changement d’ordre ou de sélection */
  useEffect(() => {
    if (skipSyncRef.current) return;
    if (order.length === 0) {
      // Pas de mot : on vide la question
      setQuestionsForEdit((prev) => ({
        questions: prev.questions.map((q, i) =>
          i === questionIndex ? { ...q, text: "", fields: [] } : q
        ),
      }));
      return;
    }

    const fields: FieldType[] = order.map((w, index) => ({
      id: index,
      // le mot sélectionné est masqué (entouré d'underscores)
      text: index === selectedWordIndex ? `_${w}_` : w,
      type: "changeable",
    }));

    setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex) return q;
        return { ...q, text: fields.map((f) => f.text).join(" "), fields };
      }),
    }));
  }, [order, selectedWordIndex]);

  /* Focus initial sur l’input */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  /* Ajoute le mot courant de l’input dans la liste */
  const addWordFromInput = () => {
    const word = editValue.trim();
    if (!word) return;

    setOrder((prev) => [...prev, word]);
    setEditValue("");
    focusInput();
  };

  /* Retire un mot précis et le renvoie dans l’input pour modification */
  const handleRemoveWord = (index: number) => {
    const removed = order[index];
    if (!removed) return;

    setOrder((prev) => prev.filter((_, i) => i !== index));
    setEditValue(removed);

    if (selectedWordIndex === index) {
      setSelectedWordIndex(Math.max(0, index - 1));
    } else if (selectedWordIndex > index) {
      setSelectedWordIndex((prev) => prev - 1);
    }

    focusInput();
  };

  /* Gestion clavier de l’input */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Espace ou Entrée valide le mot
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      addWordFromInput();
      return;
    }

    // Backspace sur input vide : le dernier mot revient dans l’input
    if (e.key === "Backspace" && editValue === "" && order.length > 0) {
      e.preventDefault();
      const lastWord = order[order.length - 1];
      setOrder((prev) => prev.slice(0, -1));
      setEditValue(lastWord);

      if (selectedWordIndex === order.length - 1) {
        setSelectedWordIndex(Math.max(0, order.length - 2));
      }

      focusInput();
    }
  };

  /* Navigation clavier directionnelle (RTL : flèche droite = mot précédent) */
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (order.length === 0) return;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        setSelectedWordIndex((p) => Math.max(0, p - 1));
        break;
      case "ArrowLeft":
        e.preventDefault();
        setSelectedWordIndex((p) => Math.min(order.length - 1, p + 1));
        break;
      case "Home":
        e.preventDefault();
        setSelectedWordIndex(0);
        break;
      case "End":
        e.preventDefault();
        setSelectedWordIndex(order.length - 1);
        break;
    }
  };

  const handleMoveLeft = () => setSelectedWordIndex((p) => Math.max(0, p - 1));
  const handleMoveRight = () =>
    setSelectedWordIndex((p) => Math.min(order.length - 1, p + 1));

  const handleSelectWord = (index: number) => setSelectedWordIndex(index);

  const handleReset = () => {
    setOrder([]);
    setEditValue("");
    setSelectedWordIndex(0);
    skipSyncRef.current = true;

    setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, text: "", fields: [] } : q
      ),
    }));

    skipSyncRef.current = false;
    inputRef.current?.focus();
  };

  return (
    <div className={style["container"]}>
      <div
        className={style["words-row"]}
        tabIndex={0}
        onKeyDown={handleRowKeyDown}
        onClick={focusInput}
      >
        {order.map((word, index) => (
          <span
            key={index}
            className={`${style["word-chip"]} ${
              index === selectedWordIndex ? style["selected"] : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectWord(index);
            }}
          >
            <span className={style["chip-word"]}>{word}</span>
            <button
              type="button"
              className={style["chip-remove"]}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveWord(index);
              }}
              aria-label="Modifier ce mot"
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={order.length === 0 ? "הקלד משפט..." : ""}
          className={style["word-input"]}
        />
      </div>

      {order.length > 0 && (
        <div className={style["controls"]}>
          <button
            type="button"
            className={style["arrow-btn"]}
            onClick={handleMoveLeft}
            disabled={order.length < 2}
            aria-label="Mot précédent"
          >
            <CaretRightFilled />
          </button>

          <button
            type="button"
            className={style["arrow-btn"]}
            onClick={handleMoveRight}
            disabled={order.length < 2}
            aria-label="Mot suivant"
          >
            <CaretLeftFilled />
          </button>

          <CloseOutlined className={style["reset-btn"]} onClick={handleReset} />
        </div>
      )}
    </div>
  );
};

export default DragInput;
