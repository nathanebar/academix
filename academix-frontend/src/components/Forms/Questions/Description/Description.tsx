// src/components/Questions/Description/Description.tsx
import React from "react";
import { FileTextOutlined } from "@ant-design/icons";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import { getCurrentSelectValue } from "../../../../utils/getCurrentSelectValue";
import { QuestionType } from "../../../../types/types";
import headerQuestionStyle from "../questionHeader.module.css";
import TextArea from "antd/es/input/TextArea";
import style from "./description.module.css";

type Props = {
  question: QuestionType;
  questionIndex: number;
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  onSelectChange: (value: number, index: number) => void;
};

const Description = (props: Props) => {
  const { question, questionIndex } = props;

  const handleTextChange = (text: string) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, text } : q
      ),
    }));
  };

  return (
    <div className={headerQuestionStyle.container}>
      {/* ---------- en-tête : select seul ---------- */}
      <div
        className={headerQuestionStyle.questionContainer}
        style={{ justifyContent: "flex-start" }}
      >
        <div
          style={{ width: "11vw", marginLeft: "1.5vw" }}
          className={headerQuestionStyle.selectContainer}
        >
          <QuestionTypeSelect
            value={getCurrentSelectValue(props)}
            onChange={(value) =>
              props.onSelectChange(value, props.questionIndex)
            }
          />
        </div>
      </div>

      {/* ---------- zone texte ---------- */}
      <div className={style["input-container"]}>
        <div className={style["label"]}>
          <FileTextOutlined /> תיאור
        </div>
        <TextArea
          value={question.text}
          onChange={({ target }) => handleTextChange(target.value)}
          placeholder="כתוב כאן תיאור / הוראות למבחן..."
          className={style["TextArea"]}
        />
      </div>
    </div>
  );
};

export default Description;