import React, { useEffect, useRef, useState } from "react";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { InputRef } from "antd";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import style from "./matrixSingle.module.css";
import headerQuestionStyle from "../questionHeader.module.css";
import { getCurrentSelectValue } from "../../../../utils/getCurrentSelectValue";
import { QuestionType } from "../../../../types/types";

type Props = {
  question: QuestionType;
  questionIndex: number;
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  onSelectChange: (value: number, index: number) => void;
};

type MatchRow = { value1: string; value2: string };

const MatchingPairs = (props: Props) => {
  const { question, questionIndex } = props;
  const matches: MatchRow[] = question?.matches ?? [];
  const [newValue1, setNewValue1] = useState("");
  const [newValue2, setNewValue2] = useState("");

  // Ref pour le premier input (מושג) de la zone d'ajout
  const newConceptRef = useRef<InputRef>(null);

  const updateQuestion = (patch: Partial<QuestionType>) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, ...patch } : q
      ),
    }));
  };

  /* ---------- initialisation : une paire vide par défaut ---------- */
  useEffect(() => {
    if (!matches || matches.length === 0) {
      updateQuestion({ matches: [{ value1: "", value2: "" }] });
    }
  }, [question.type]);

  /* ---------- édition directe (sans état local => pas de boucle) ---------- */
  const updateMatch = (
    index: number,
    field: "value1" | "value2",
    value: string
  ) => {
    updateQuestion({
      matches: matches.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    });
  };

  /* ---------- ajout via Enter ---------- */
  const addMatch = () => {
    const v1 = newValue1.trim();
    const v2 = newValue2.trim();
    if (!v1 || !v2) return;

    updateQuestion({ matches: [...matches, { value1: v1, value2: v2 }] });
    setNewValue1("");
    setNewValue2("");

    // Replace le focus sur le champ « מושג » après l'ajout
    setTimeout(() => {
      newConceptRef.current?.focus();
    }, 0);
  };

  /* ---------- suppression (garde au moins 1 ligne) ---------- */
  const removeMatch = (index: number) => {
    if (matches.length <= 1) return;
    updateQuestion({ matches: matches.filter((_, i) => i !== index) });
  };

  return (
    <div className={style.container}>
      {/* ---------- en-tête : select seul ---------- */}
      <div
        className={headerQuestionStyle.questionContainer}
        style={{ justifyContent: "flex-start" }}
      >
        <div className={headerQuestionStyle.selectContainer}>
          <QuestionTypeSelect
            value={getCurrentSelectValue(props)}
            onChange={(value) =>
              props.onSelectChange(value, props.questionIndex)
            }
          />
        </div>
      </div>

      {/* ---------- paires motif / concept ---------- */}
      <div className={style.section}>
        <div className={style.sectionTitle}>זוגות (מושג ↔ תואם)</div>

        <div className={style.list}>
          {matches.map((m, index) => (
            <div key={index} className={style.row}>
              <span className={style.rowIndex}>{index + 1}.</span>

              <div className={style.pairCard}>
                <RegularInput
                  borderRadius="999px"
                  height="3.6vh"
                  value={m.value1 ?? ""}
                  onChange={({ target }) =>
                    updateMatch(index, "value1", target.value)
                  }
                  placeholder="הקלד מושג"
                />
                <span className={style.arrow}>←</span>
                <RegularInput
                  borderRadius="999px"
                  height="3.6vh"
                  value={m.value2 ?? ""}
                  onChange={({ target }) =>
                    updateMatch(index, "value2", target.value)
                  }
                  placeholder="מושג תואם"
                />
              </div>

              {matches.length > 1 && (
                <CloseOutlined
                  className={style.removeBtn}
                  onClick={() => removeMatch(index)}
                />
              )}
            </div>
          ))}
        </div>

        {/* ---------- ajout par Enter (champ double) ---------- */}
        <div className={style.addRow}>
          <div className={style.pairCard}>
            <RegularInput
              ref={newConceptRef}
              borderRadius="999px"
              height="3.6vh"
              value={newValue1}
              setValue={setNewValue1}
              onEnterclickProps={addMatch}
              placeholder="מושג"
            />
            <span className={style.arrow}>←</span>
            <RegularInput
              borderRadius="999px"
              height="3.6vh"
              value={newValue2}
              setValue={setNewValue2}
              onEnterclickProps={addMatch}
              placeholder="תואם"
            />
            <span className={style.addBtn} onClick={addMatch}>
              <PlusOutlined />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingPairs;
