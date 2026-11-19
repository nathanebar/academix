// QuestionsComponents/Fill_in_OpenQuestion/Fill_in_OpenQuestion.tsx
import React, { useEffect, useState } from "react";
import style from "./Fill_In_OpenQuestion.module.css";
import { QuestionProps } from "../../../../types/types";
import { ConfigProvider, Input } from "antd";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

const Fill_in_open = (props: QuestionProps) => {
  const parts = props.question
    .split(/(_[^_]+_)/g)
    .map((part) => (part.startsWith("_") ? part.replace(/_/g, "") : part));
  const [missingWord, setMissingWord] = useState<string>("");
  const [trigger, setTrigger] = useState<boolean>(false);
  const isAnswer = props.renderFor === "answer";
  console.log(props);
  useEffect(() => {
    if (isAnswer) {
      const fromFormData = (props.formData || []).find(
        (i: any) => i.form_question_id === props.questionId
      );
      setMissingWord(fromFormData?.value_text || "");
    } else {
      setMissingWord(props.submission?.[0]?.value_text || "");
    }
  }, [JSON.stringify(props.formData), JSON.stringify(props.submission)]);

  const saveAnswer = () => {
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : []; // 🛡
      const idx = prevArr.findIndex(
        (i: any) => i.form_question_id === props.questionId
      );
      if (idx !== -1) {
        const updated = [...prevArr];
        updated[idx] = { ...updated[idx], value_text: missingWord };
        return updated;
      }
      return [
        ...prevArr,
        { form_question_id: props.questionId, value_text: missingWord },
      ];
    });
  };

  return (
    <ConfigProvider
      theme={{ components: { Input: { colorTextPlaceholder: "#cccccc" } } }}
    >
      <div className={style.card}>
        <div className={style.instruction}>השלם את המילה החסרה</div>
        <div className={style.sentence}>
          <span className={style.part}>{parts[0]}</span>
          <Input
            disabled={!isAnswer}
            className={style.missingWord}
            value={missingWord}
            onChange={(e) => isAnswer && setMissingWord(e.target.value)}
            onPressEnter={(e) => e.currentTarget.blur()}
            onBlur={saveAnswer}
            placeholder="____"
          />
          <span className={style.part}>{parts[2]}</span>
        </div>
        <QuestionFooter
          props={props}
          trigger={trigger}
          setTrigger={setTrigger}
        />
      </div>
    </ConfigProvider>
  );
};

export default Fill_in_open;
