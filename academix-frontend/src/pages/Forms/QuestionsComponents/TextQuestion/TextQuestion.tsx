// QuestionsComponents/TextQuestion/TextQuestion.tsx
import React, { useEffect, useState } from "react";
import style from "./TextQuestion.module.css";
import { QuestionProps } from "../../../../types/types";
import { ConfigProvider, Input } from "antd";
import he_IL from "antd/locale/he_IL";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

const TextQuestion = (props: QuestionProps) => {
  const [answerValue, setAnswerValue] = useState<string>("");
  const [trigger, setTrigger] = useState<boolean>(false);
  const isAnswer = props.renderFor === "answer";

  /* ✅ resynchronise depuis formData (mode answer / restauration de brouillon)
        ET depuis submission (show / grading) */
  useEffect(() => {
    const fromFormData = (props.formData || []).find(
      (i: any) => i.form_question_id === props.questionId
    );

    if (isAnswer) {
      setAnswerValue(fromFormData?.value_text || "");
    } else {
      setAnswerValue(props.submission?.[0]?.value_text || "");
    }
  }, [JSON.stringify(props.formData), JSON.stringify(props.submission)]);

  /* ✅ saveAnswer protégé contre prev non-tableau */
  const saveAnswer = () => {
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : []; // 🛡 garde
      const idx = prevArr.findIndex(
        (i: any) => i.form_question_id === props.questionId
      );

      if (idx !== -1) {
        const updated = [...prevArr];
        updated[idx] = { ...updated[idx], value_text: answerValue };
        return updated;
      }
      return [
        ...prevArr,
        { form_question_id: props.questionId, value_text: answerValue },
      ];
    });
  };

  return (
    <div className={style.card}>
      <div className={style.question}>{props.question}</div>

      <ConfigProvider
        locale={he_IL}
        theme={{ components: { Input: { colorTextPlaceholder: "#bdbdbd" } } }}
      >
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 8 }}
          className={style.textarea}
          value={answerValue}
          onChange={(e) => isAnswer && setAnswerValue(e.target.value)}
          onBlur={saveAnswer}
          disabled={!isAnswer}
          placeholder="כאן רושמים את התשובה..."
        />
      </ConfigProvider>

      <QuestionFooter props={props} trigger={trigger} setTrigger={setTrigger} />
    </div>
  );
};

export default TextQuestion;
