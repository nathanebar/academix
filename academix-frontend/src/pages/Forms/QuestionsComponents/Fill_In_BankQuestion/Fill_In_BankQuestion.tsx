// QuestionsComponents/Fill_In_BankQuestion/Fill_In_BankQuestion.tsx
import React, { useEffect, useState } from "react";
import style from "./Fill_In_BankQuestion.module.css";
import { QuestionProps } from "../../../../types/types";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

const Fill_in_bank = (props: QuestionProps) => {
  const parts = props.question
    .split(/(_[^_]+_)/g)
    .map((part) => (part.startsWith("_") ? part.replace(/_/g, "") : part));
  const [optionText, setOptionText] = useState<string>("_______");
  const [activeButton, setActiveButton] = useState<string | number>("");
  const [trigger, setTrigger] = useState<boolean>(false);
  const isAnswer = props.renderFor === "answer";

  /* ✅ resync depuis formData en mode answer */
  useEffect(() => {
    if (isAnswer) {
      const fromFormData = (props.formData || []).find(
        (i: any) => i.form_question_id === props.questionId
      );
      setOptionText(fromFormData?.value_text || "_______");
      setActiveButton(fromFormData?.value_text || "");
    } else {
      setOptionText(props.submission?.[0]?.value_text || "_______");
    }
  }, [JSON.stringify(props.formData), JSON.stringify(props.submission)]);

  const saveAnswer = (option: string) => {
    setOptionText(option);
    setActiveButton(option);
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : []; // 🛡
      const idx = prevArr.findIndex(
        (i: any) => i.form_question_id === props.questionId
      );
      if (idx !== -1) {
        const updated = [...prevArr];
        updated[idx] = { ...updated[idx], value_text: option };
        return updated;
      }
      return [
        ...prevArr,
        { form_question_id: props.questionId, value_text: option },
      ];
    });
  };

  return (
    <div className={style.card}>
      <div className={style.instruction}>השלם את המילה החסרה מבנק המילים</div>

      <div className={style.sentence}>
        <span className={style.part}>{parts[0]}</span>
        <div
          onClick={() => {
            setActiveButton("");
            setOptionText("_______");
          }}
          className={`${style.missingWord} ${
            isAnswer ? style.missingWordClickable : ""
          }`}
        >
          {optionText}
        </div>
        <span className={style.part}>{parts[2]}</span>
      </div>

      <div className={style.bankTitle}>בנק המילים</div>
      <div className={style.bank}>
        {props.options
          ?.filter((op: any) => op.option_text !== "")
          .map((a: any) => {
            const isChosen = isAnswer
              ? activeButton === a.option_text
              : a.option_text === props.submission?.[0]?.value_text;
            return (
              <button
                key={a.id}
                onClick={() => isAnswer && saveAnswer(a.option_text)}
                disabled={!isAnswer}
                className={`${style.chip} ${isChosen ? style.chipChosen : ""}`}
              >
                {a.option_text}
              </button>
            );
          })}
      </div>

      <QuestionFooter props={props} trigger={trigger} setTrigger={setTrigger} />
    </div>
  );
};

export default Fill_in_bank;
