// QuestionsComponents/True_FalseQuestion/True_FalseQuestion.tsx
import React, { useEffect, useState } from "react";
import style from "./True_FalseQuestion.module.css";
import { QuestionProps } from "../../../../types/types";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

const True_False = (props: QuestionProps) => {
  const [activeButton, setActiveButton] = useState<string>("");
  const [trigger, setTrigger] = useState<boolean>(false);
  const isAnswer = props.renderFor === "answer";

  useEffect(() => {
    if (isAnswer) {
      const fromFormData = (props.formData || []).find(
        (i: any) => i.form_question_id === props.questionId
      );
      setActiveButton(fromFormData?.value_text || "");
    } else {
      setActiveButton(props.submission?.[0]?.value_text || "");
    }
  }, [JSON.stringify(props.formData), JSON.stringify(props.submission)]);

  const saveAnswer = (option: string) => {
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
      return [...prevArr, { form_question_id: props.questionId, value_text: option }];
    });
  };

  const chosen = activeButton;

  return (
    <div className={style.card}>
      <div className={style.instruction}>סמן את התשובה הנכונה</div>
      <div className={style.question}>{props.question}</div>

      <div className={style.buttons}>
        <button
          onClick={() => isAnswer && saveAnswer("נכון")}
          disabled={!isAnswer && chosen !== "נכון"}
          className={`${style.btn} ${chosen === "נכון" ? style.btnTrue : ""}`}
        >
          נכון <CheckOutlined />
        </button>
        <button
          onClick={() => isAnswer && saveAnswer("לא נכון")}
          disabled={!isAnswer && chosen !== "לא נכון"}
          className={`${style.btn} ${chosen === "לא נכון" ? style.btnFalse : ""}`}
        >
          לא נכון <CloseOutlined />
        </button>
      </div>

      <QuestionFooter props={props} trigger={trigger} setTrigger={setTrigger} />
    </div>
  );
};

export default True_False;