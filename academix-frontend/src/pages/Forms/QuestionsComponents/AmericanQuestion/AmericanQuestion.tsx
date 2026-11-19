// QuestionsComponents/AmericanQuestion/AmericanQuestion.tsx
import React, { useEffect, useState } from "react";
import style from "./AmericanQuestion.module.css";
import { QuestionProps } from "../../../../types/types";
import { ConfigProvider, Radio, RadioChangeEvent } from "antd";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

const AmericanQuestion = (props: QuestionProps) => {
  const [optionValue, setOptionValue] = useState<number>();
  const [trigger, setTrigger] = useState<boolean>(false);
  const isAnswer = props.renderFor === "answer";
  console.log(props);
  /* ✅ resync depuis formData (answer) / submission (show-grading) */
  useEffect(() => {
    if (isAnswer) {
      const fromFormData = (props.formData || []).find(
        (i: any) => i.form_question_id === props.questionId
      );
      setOptionValue(fromFormData?.selected_option_id);
    } else {
      setOptionValue(props.submission?.[0]?.selected_option_id);
    }
  }, [JSON.stringify(props.formData), JSON.stringify(props.submission)]);

  const handleSave = (value: number) => {
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : []; // 🛡
      const idx = prevArr.findIndex(
        (i: any) => i.form_question_id === props.questionId
      );
      if (idx !== -1) {
        const updated = [...prevArr];
        updated[idx] = { ...updated[idx], selected_option_id: value };
        return updated;
      }
      return [
        ...prevArr,
        { form_question_id: props.questionId, selected_option_id: value },
      ];
    });
  };
  const sortedOptions = [...props.options].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  );
  return (
    <div className={style.card}>
      <div className={style.question}>{props.question}</div>

      <ConfigProvider
        theme={{ components: { Radio: { colorTextDisabled: "black" } } }}
      >
        <Radio.Group
          className={style.radioGroup}
          disabled={!isAnswer}
          onChange={(e: RadioChangeEvent) => {
            setOptionValue(e.target.value);
            handleSave(e.target.value);
          }}
          value={optionValue}
        >
          {sortedOptions.map((option: any, i: number) => (
            <Radio value={option?.id} key={option?.id} className={style.radio}>
              <span className={style.optionLetter}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={style.optionText}>{option?.option_text}</span>
            </Radio>
          ))}
        </Radio.Group>
      </ConfigProvider>

      <QuestionFooter props={props} trigger={trigger} setTrigger={setTrigger} />
    </div>
  );
};

export default AmericanQuestion;
