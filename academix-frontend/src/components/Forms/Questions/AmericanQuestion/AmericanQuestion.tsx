// src/components/Questions/AmericanQuestion/AmericanQuestion.tsx
import React, { useState } from "react";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { Input, Tooltip } from "antd";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import headerQuestionStyle from "../questionHeader.module.css";
import style from "./AmericanQuestion.module.css";
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

const AmericanQuestion = (props: Props) => {
  const options = props.question?.options ?? [];
  const [newOption, setNewOption] = useState<string>("");

  /* ---------- Source de vérité unique = question.options ---------- */
  const updateOptions = (nextOptions: string[]) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === props.questionIndex ? { ...q, options: nextOptions } : q
      ),
    }));
  };

  const handleQuestionTextChange = (text: string) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === props.questionIndex ? { ...q, text } : q
      ),
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    updateOptions(next);
  };

  const addOption = () => {
    const value = newOption.trim();
    if (!value) return;
    updateOptions([...options, value]);
    setNewOption("");
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) return;
    updateOptions(options.filter((_, i) => i !== index));
  };

  return (
    <div className={headerQuestionStyle.container}>
      {/* ----- En-tête : type + texte de la question ----- */}
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
          <Input
            placeholder="שאלה"
            value={props.question.text}
            onChange={(e) => handleQuestionTextChange(e.target.value)}
            className={style.TextArea}
          />
        </div>
      </div>

      {/* ----- Options (sans notion de "bonne réponse" en création) ----- */}
      <div className={style.optionsContainer}>
        <div className={style.optionsTitle}>תשובות אפשריות</div>

        {options.map((option, index) => (
          <div key={index} className={style.optionRow}>
            {/* Punctuation décorative : A/B/C… (colle à l'ordre) */}
            <span className={style.optionLetter}>
              {String.fromCharCode(65 + index)}
            </span>

            <RegularInput
              borderRadius="10px"
              height="4vh"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`אופציה ${index + 1}`}
            />

            {/* Supprimer (on garde au moins une option) */}
            {options.length > 1 && (
              <CloseOutlined
                className={style.removeBtn}
                onClick={() => removeOption(index)}
              />
            )}
          </div>
        ))}

        {/* ----- Ajouter une option ----- */}
        <div className={style.addRow}>
          <RegularInput
            borderRadius="10px"
            height="4vh"
            value={newOption}
            setValue={setNewOption}
            onEnterclickProps={addOption}
            placeholder="הוספת תשובה"
          />
          <Tooltip title="הוספת תשובה">
            <span className={style.addBtn} onClick={addOption}>
              <PlusOutlined />
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default AmericanQuestion;
