import React from "react";
import { EditOutlined } from "@ant-design/icons";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import style from "./TextQuestion.module.css";
import headerQuestionStyle from "../questionHeader.module.css";
import { Question, QuestionType } from "../../../../types/types";
import { getCurrentSelectValue } from "../../../../utils/getCurrentSelectValue";
import TextArea from "antd/es/input/TextArea";

type Props = {
  question: Question;
  questionIndex: number;
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  onSelectChange: (value: number, index: number) => void;
};

const TextQuestion = (props: Props) => {
  const handleQuestionTextChange = (text: string) => {
    props.setQuestionsForEdit((prevQuestions) => ({
      questions: prevQuestions.questions.map((question, index) =>
        index === props.questionIndex
          ? {
              ...question,
              text: text,
            }
          : question
      ),
    }));
  };

  return (
    <div className={headerQuestionStyle.container}>
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

      <div className={style["input-container"]}>
        <TextArea disabled value="תשובה" className={style["TextArea"]} />
        <EditOutlined className={style["edit-icon"]} />
      </div>
    </div>
  );
};

export default TextQuestion;
