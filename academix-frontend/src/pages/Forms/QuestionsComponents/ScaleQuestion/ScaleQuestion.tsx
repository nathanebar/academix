// QuestionsComponents/ScaleQuestion/ScaleQuestion.tsx
import { ConfigProvider, Slider } from "antd";
import { QuestionProps } from "../../../../types/types";
import style from "./ScaleQuestion.module.css";
import { useEffect, useState } from "react";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

const Scale = (props: QuestionProps) => {
  const orderIndexes = props.options?.map((item: any) => item.orderIndex);
  const lower = orderIndexes?.length ? Math.min(...orderIndexes) : 0;
  const higher = orderIndexes?.length ? Math.max(...orderIndexes) : 10;

  const [value, setValue] = useState<number>(lower);
  const [trigger, setTrigger] = useState<boolean>(false);
  const isAnswer = props.renderFor === "answer";

  useEffect(() => {
    if (isAnswer) {
      const fromFormData = (props.formData || []).find(
        (i: any) => i.form_question_id === props.questionId
      );
      setValue(fromFormData?.value_number ?? lower);
    } else {
      setValue(props.submission?.[0]?.value_number ?? lower);
    }
  }, [
    JSON.stringify(props.formData),
    JSON.stringify(props.submission),
    lower,
    higher,
  ]);

  const handleChange = (v: number) => {
    setValue(v);
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : []; // 🛡
      const idx = prevArr.findIndex(
        (i: any) => i.form_question_id === props.questionId
      );
      if (idx !== -1) {
        const updated = [...prevArr];
        updated[idx] = { ...updated[idx], value_number: v };
        return updated;
      }
      return [
        ...prevArr,
        { form_question_id: props.questionId, value_number: v },
      ];
    });
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Slider: { handleColor: "#232b3a", handleActiveColor: "#232b3a" },
        },
      }}
    >
      <div className={style.card}>
        <div className={style.question}>{props.question}</div>
        <div className={style.scaleBox}>
          <Slider
            disabled={!isAnswer}
            onChange={handleChange}
            value={value}
            min={lower}
            max={higher}
            step={1}
            reverse
          />
          <div className={style.scaleLabels}>
            <span>{higher}</span>
            <span>{lower}</span>
          </div>
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

export default Scale;
