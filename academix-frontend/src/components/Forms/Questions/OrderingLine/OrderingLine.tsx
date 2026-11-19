// src/components/Questions/OrderingLine/OrderingLine.tsx
import React, { useEffect, useState } from "react";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import headerQuestionStyle from "../questionHeader.module.css";
import style from "./orderingLine.module.css";
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

const OrderingLine = (props: Props) => {
  const { question, questionIndex } = props;
  const options: string[] = question?.options ?? [];
  const [newSentence, setNewSentence] = useState("");

  const updateQuestion = (patch: Partial<QuestionType>) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, ...patch } : q
      ),
    }));
  };

  /* ---------- initialisation : une phrase vide par défaut ---------- */
  useEffect(() => {
    if (!question.options || question.options.length === 0) {
      updateQuestion({ options: [""] });
    }
  }, [question.type]);

  /* ---------- édition ---------- */
  const updateSentence = (index: number, value: string) => {
    updateQuestion({
      options: options.map((s, i) => (i === index ? value : s)),
    });
  };

  /* ---------- ajout via Enter ---------- */
  const addSentence = () => {
    const v = newSentence.trim();
    if (!v) return;
    updateQuestion({ options: [...options, v] });
    setNewSentence("");
  };

  /* ---------- suppression (garde au moins 1 ligne) ---------- */
  const removeSentence = (index: number) => {
    if (options.length <= 1) return;
    updateQuestion({ options: options.filter((_, i) => i !== index) });
  };

  return (
    <div className={headerQuestionStyle.container}>
      {/* ---------- en-tête : select seul ---------- */}
      <div
        className={headerQuestionStyle.questionContainer}
        style={{ justifyContent: "flex-start", display: "flex" }}
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

      {/* ---------- phrases à ordonner ---------- */}
      <div className={style["section"]}>
        <div className={style["section-title"]}>משפטים לפי הסדר הנכון</div>
        <div className={style["inputs"]}>
          {options.map((sentence, orderIndex) => (
            <div key={orderIndex} className={style["row"]}>
              <span className={style["row-index"]}>{orderIndex + 1}.</span>
              <RegularInput
                borderRadius="10px"
                height="4.2vh"
                value={sentence}
                onChange={({ target }) =>
                  updateSentence(orderIndex, target.value)
                }
                placeholder={`משפט ${orderIndex + 1}`}
              />
              {options.length > 1 && (
                <CloseOutlined
                  className={style["remove-btn"]}
                  onClick={() => removeSentence(orderIndex)}
                />
              )}
            </div>
          ))}

          {/* ---------- ajout par Enter ---------- */}
          <div className={style["add-row"]}>
            <RegularInput
              borderRadius="10px"
              height="4.2vh"
              value={newSentence}
              setValue={setNewSentence}
              onEnterclickProps={addSentence}
              suffix={<PlusOutlined onClick={addSentence} />}
              placeholder="הוסף משפט (Enter)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderingLine;
