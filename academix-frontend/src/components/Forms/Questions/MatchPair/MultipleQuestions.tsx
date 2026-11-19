// src/components/Questions/MatchPair/MatchPair.tsx
import React, { useEffect, useState } from "react";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import DragInput from "../../../../UI/dragInput/DragInput";
import headerQuestionStyle from "../questionHeader.module.css";
import style from "./MultipleQuestions.module.css";
import { getCurrentSelectValue } from "../../../../utils/getCurrentSelectValue";
import { QuestionType } from "../../../../types/types";

type Props = {
  question: any;
  questionIndex: number;
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  onSelectChange: (value: number, index: number) => void;
};

/* ✅ garantit qu'une ligne contient TOUJOURS value1 ET value2 (jamais undefined) */
const normalizeRow = (m: any = {}) => ({
  value1: m?.value1 ?? "",
  value2: m?.value2 ?? "", // '' = bonne réponse pas encore définie (phase correction)
});

const MultipleQuestions = (props: Props) => {
  const { question, questionIndex } = props;

  // matches (normalisés) = questions (matching) OU banque de mots (fill_in_bank)
  const matches: any[] = (question?.matches ?? []).map(normalizeRow);
  // options = pool de réponses partagé (matching uniquement)
  const answerPool: string[] = question?.options ?? [];

  const [newAnswer, setNewAnswer] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  const updateQuestion = (patch: Partial<QuestionType>) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, ...patch } : q
      ),
    }));
  };

  /* ==================== matching : pool de réponses ==================== */
  const updateAnswer = (index: number, value: string) => {
    updateQuestion({
      options: answerPool.map((a, i) => (i === index ? value : a)),
    });
  };

  const addAnswer = () => {
    const v = newAnswer.trim();
    if (!v) return;
    updateQuestion({ options: [...answerPool, v] });
    setNewAnswer("");
  };

  const removeAnswer = (index: number) => {
    if (answerPool.length <= 1) return;
    updateQuestion({ options: answerPool.filter((_, i) => i !== index) });
  };

  /* ==================== matching : questions ==================== */
  const updateQuestionRow = (index: number, value: string) => {
    updateQuestion({
      matches: matches.map((m, i) =>
        i === index ? { ...m, value1: value, value2: "" } : m
      ),
    });
  };

  const addQuestionRow = () => {
    const v = newQuestion.trim();
    if (!v) return;
    // ✅ value2 TOUJOURS présent (chaîne vide), jamais undefined
    updateQuestion({ matches: [...matches, { value1: v, value2: "" }] });
    setNewQuestion("");
  };

  const removeQuestionRow = (index: number) => {
    if (matches.length <= 1) return;
    updateQuestion({ matches: matches.filter((_, i) => i !== index) });
  };

  /* ==================== init ==================== */
  useEffect(() => {
    if (!matches || matches.length === 0) {
      updateQuestion({
        matches: [{ value1: "", value2: "" }],
        options: ["", ""],
      });
    }
  }, [question.type]);

  return (
    <div className={style.container}>
      {/* ---------- instructions ---------- */}
      <div className={style["info-panel"]}>
        <p className={style["info-text"]}>
          <>
            כתוב <strong>שאלות</strong> והוסף <strong>מאגר תשובות</strong> משותף
            — כל השאלות ישתמשו באותן תשובות. (התאמה תוגדר בשלב הבדיקה)
          </>
        </p>
      </div>

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

      <div className={style["content"]}>
        {/* Pool de réponses */}
        <div className={style["section"]}>
          <div className={style["section-title"]}>מאגר תשובות משותף</div>
          <div className={style["list"]}>
            {answerPool.map((a, index) => (
              <div key={index} className={style["item"]}>
                <RegularInput
                  borderRadius="999px"
                  height="3.4vh"
                  value={a}
                  onChange={({ target }) => updateAnswer(index, target.value)}
                  placeholder={`תשובה ${index + 1}`}
                />
                {answerPool.length > 1 && (
                  <CloseOutlined
                    className={style["remove-btn"]}
                    onClick={() => removeAnswer(index)}
                  />
                )}
              </div>
            ))}
            <div className={style["add-row"]}>
              <RegularInput
                borderRadius="999px"
                height="3.6vh"
                value={newAnswer}
                setValue={setNewAnswer}
                onEnterclickProps={addAnswer}
                suffix={<PlusOutlined onClick={addAnswer} />}
                placeholder="הוסף תשובה (Enter)"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className={style["section"]}>
          <div className={style["section-title"]}>שאלות</div>
          <div className={style["list"]}>
            {matches.map((m, index) => (
              <div key={index} className={style["item"]}>
                <span className={style["row-index"]}>{index + 1}.</span>
                <RegularInput
                  borderRadius="10px"
                  height="4vh"
                  value={m?.value1 ?? ""}
                  onChange={({ target }) =>
                    updateQuestionRow(index, target.value)
                  }
                  placeholder={`שאלה ${index + 1}`}
                />
                {matches.length > 1 && (
                  <CloseOutlined
                    className={style["remove-btn"]}
                    onClick={() => removeQuestionRow(index)}
                  />
                )}
              </div>
            ))}
            <div className={style["add-row"]}>
              <RegularInput
                borderRadius="10px"
                height="4vh"
                value={newQuestion}
                setValue={setNewQuestion}
                onEnterclickProps={addQuestionRow}
                suffix={<PlusOutlined onClick={addQuestionRow} />}
                placeholder="הוסף שאלה (Enter)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleQuestions;
