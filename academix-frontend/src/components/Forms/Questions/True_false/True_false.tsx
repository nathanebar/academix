// src/components/Questions/True_false/True_false.tsx
import React from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import headerQuestionStyle from "../questionHeader.module.css";
import style from "./true_false.module.css";
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

const True_false = (props: Props) => {
  const handleQuestionTextChange = (text: string) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === props.questionIndex ? { ...q, text } : q
      ),
    }));
  };

  return (
    <div className={headerQuestionStyle.container}>
      {/* ---------- en-tête : type + texte ---------- */}
      <div className={headerQuestionStyle.questionContainer}>
        <div className={headerQuestionStyle.selectContainer}>
          <QuestionTypeSelect
            value={getCurrentSelectValue(props)}
            onChange={(value) =>
              props.onSelectChange(value, props.questionIndex)
            }
          />
        </div>
        <div className={headerQuestionStyle["input-container"]}>
          <RegularInput
            width="30.33796296296296vw"
            borderRadius="10px"
            height="4.2vh"
            placeholder="שאלה"
            value={props.question.text}
            setValue={handleQuestionTextChange}
          />
        </div>
      </div>

      {/* ---------- prévisualisation (candidat verra ces 2 boutons, réponse définie en correction) ---------- */}
      <div className={style.buttons}>
        <div className={style.previewLabel}>תצוגה מקדימה — התשובה תוגדר בשלב הבדיקה</div>
        <div className={style.buttonGroup}>
          <div className={`${style.button} ${style.false}`}>
            <CloseOutlined />
            לא נכון
          </div>
          <div className={`${style.button} ${style.true}`}>
            <CheckOutlined />
            נכון
          </div>
        </div>
      </div>
    </div>
  );
};

export default True_false;