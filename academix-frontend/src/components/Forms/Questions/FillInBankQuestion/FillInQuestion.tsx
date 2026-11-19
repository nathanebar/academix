// src/components/Questions/FillInQuestion/FillInQuestion.tsx
import React, { useEffect, useState } from "react";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { QuestionCircleOutlined } from "@ant-design/icons";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import DragInput from "../../../../UI/dragInput/DragInput";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import headerQuestionStyle from "../questionHeader.module.css";
import styles from "./FillInQuestion.module.css";
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

const FillInQuestion = (props: Props) => {
  const { question, questionIndex } = props;
  console.log(question);
  const isBank = question.type === "fill_in_bank";

  const matches: any[] = (question?.matches ?? []).map((m: any) => ({
    value1: m?.value1 ?? "",
    value2: m?.value2 ?? "",
  }));
  const [newBankWord, setNewBankWord] = useState("");

  const updateQuestion = (patch: Partial<QuestionType>) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, ...patch } : q
      ),
    }));
  };

  /* ---------- banque de mots (fill_in_bank uniquement) ---------- */
  const updateBankWord = (index: number, value: string) => {
    updateQuestion({
      matches: matches.map((m, i) =>
        i === index ? { ...m, value1: value, value2: "" } : m
      ),
    });
  };

  const addBankWord = () => {
    const v = newBankWord.trim();
    if (!v) return;
    updateQuestion({ matches: [...matches, { value1: v, value2: "" }] });
    setNewBankWord("");
  };

  const removeBankWord = (index: number) => {
    if (matches.length <= 1) return;
    updateQuestion({ matches: matches.filter((_, i) => i !== index) });
  };

  /* ---------- init : 3 mots par défaut pour la banque ---------- */
  useEffect(() => {
    if (isBank && (!matches || matches.length === 0)) {
      updateQuestion({ matches: [{ value1: "", value2: "" }] });
    }
  }, [question.type]);

  return (
    <div className={headerQuestionStyle.container}>
      {/* ---------- Panneau d'instructions (selon le type) ---------- */}
      <div className={styles["rules-panel"]}>
        <QuestionCircleOutlined className={styles["rules-icon"]} />
        <div className={styles["rules-text"]}>
          כתוב את המשפט הרצוי במלואו, ולאחר מכן לחץ על Enter.
          <br />
          בעזרת מקשי החיצים ימינה ושמאלה בחר את המילה החסרה
          {isBank ? (
            <>
              {" "}
              והוסף <strong>בנק מילים</strong> — הנבחן יבחר את המילה הנכונה מתוך
              הבנק.
            </>
          ) : (
            <> — הנבחן ימלא את המילה החסרה.</>
          )}
        </div>
      </div>

      {/* ---------- En-tête : type + phrase (DragInput) ---------- */}
      <div
        className={headerQuestionStyle.questionContainer}
        style={{ display: "flex", justifySelf: "start" }}
      >
        <div className={headerQuestionStyle.selectContainer}>
          <QuestionTypeSelect
            value={getCurrentSelectValue(props)}
            onChange={(value) =>
              props.onSelectChange(value, props.questionIndex)
            }
          />
        </div>
        {(question?.fields || question?.text) && (
          <DragInput
            question={question}
            editMissingWord
            setQuestionsForEdit={props.setQuestionsForEdit}
            questionIndex={questionIndex}
          />
        )}
      </div>

      {/* ---------- Banque de mots (fill_in_bank uniquement) ---------- */}
      {isBank && (
        <div className={styles["bank"]}>
          <div className={styles["bank-title"]}>בנק מילים</div>
          <div className={styles["bank-list"]}>
            {matches.map((m, index) => (
              <div key={index} className={styles["bank-row"]}>
                <span className={styles["row-index"]}>{index + 1}.</span>
                <RegularInput
                  borderRadius="10px"
                  height="4vh"
                  value={m.value1}
                  onChange={({ target }) => updateBankWord(index, target.value)}
                  placeholder={`מילה ${index + 1}`}
                />
                {matches.length > 1 && (
                  <CloseOutlined
                    className={styles["remove-btn"]}
                    onClick={() => removeBankWord(index)}
                  />
                )}
              </div>
            ))}
            <div className={styles["add-row"]}>
              <RegularInput
                borderRadius="10px"
                height="4vh"
                value={newBankWord}
                setValue={setNewBankWord}
                onEnterclickProps={addBankWord}
                suffix={<PlusOutlined onClick={addBankWord} />}
                placeholder="הוסף מילה לבנק (Enter)"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillInQuestion;
