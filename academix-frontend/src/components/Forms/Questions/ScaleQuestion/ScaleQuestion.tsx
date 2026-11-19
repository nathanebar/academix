import React from "react";
import { ConfigProvider, Select } from "antd";
import QuestionTypeSelect from "../QuestionTypeSelect/QuestionTypeSelect";
import RegularInput from "../../../../UI/Input/Input/RegularInput";
import style from "./ScaleQuestion.module.css";
import headerQuestionStyle from "../questionHeader.module.css";
import { getCurrentSelectValue } from "../../../../utils/getCurrentSelectValue";
import { QuestionType, ScaleQuestionType } from "../../../../types/types";
import { CloseOutlined } from "@ant-design/icons";

/* ✅ options statiques : créées une seule fois (pas à chaque rendu) */
const MIN_OPTIONS = Array.from({ length: 41 }, (_, i) => ({
  label: i,
  value: i,
}));
const MAX_OPTIONS = Array.from({ length: 40 }, (_, i) => ({
  label: i + 1,
  value: i + 1,
}));

/* ✅ construit un objet min/max complet avec valeurs par défaut
     => garantit `title: string` et `value: number` (fix du type TS) */
const buildScale = (
  current: { title?: string; value?: number } | undefined,
  patch: Partial<{ title: string; value: number }>
): { title: string; value: number } => ({
  title: patch.title !== undefined ? patch.title : current?.title ?? "",
  value: patch.value !== undefined ? patch.value : current?.value ?? 0,
});

type Props = {
  question: ScaleQuestionType;
  questionIndex: number;
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  onSelectChange: (value: number, index: number) => void;
};

/* ---------- petite carte réutilisable min / max ---------- */
type ScaleFieldProps = {
  label: string;
  badgeClass: string;
  options: { label: number; value: number }[];
  title: string;
  value: number;
  onTitleChange: (v: string) => void;
  onValueSelect: (v: number) => void;
  onClear: () => void;
};

const ScaleField = ({
  label,
  badgeClass,
  options,
  title,
  value,
  onTitleChange,
  onValueSelect,
  onClear,
}: ScaleFieldProps) => (
  <div className={style["field-card"]}>
    <div className={style["field-header"]}>
      <span className={`${style["field-dot"]} ${style[badgeClass]}`} />
      <span>{label}</span>
    </div>
    <div className={style["field-body"]}>
      <RegularInput
        borderRadius="10px"
        height="3.4vh"
        suffix={<CloseOutlined onClick={onClear} />}
        placeholder="תווית אופציונאלית"
        value={title}
        onChange={({ target }) => onTitleChange(target.value)}
      />
      <Select
        options={options}
        className={style["select_range"]}
        value={value}
        onSelect={onValueSelect}
        popupMatchSelectWidth={false}
      />
    </div>
  </div>
);

const ScaleQuestion = (props: Props) => {
  const { question, questionIndex } = props;

  /* ✅ écriture unique — maj du champ min ou max via buildScale (pas d'état local) */
  const updateScale = (
    side: "min" | "max",
    patch: Partial<{ title: string; value: number }>
  ) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex) return q;
        return side === "min"
          ? { ...q, min: buildScale(q.min, patch) }
          : { ...q, max: buildScale(q.max, patch) };
      }),
    }));
  };

  const handleQuestionTextChange = (text: string) => {
    props.setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, text } : q
      ),
    }));
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
          <RegularInput
            width="30.33796296296296vw"
            borderRadius="10px"
            height="4.2vh"
            placeholder="שאלה"
            value={question.text}
            setValue={handleQuestionTextChange}
          />
        </div>
      </div>

      {/* ----- Panneau "טווח / échelle" ----- */}
      <div className={style["fields_container"]}>
        <div className={style["range-label"]}>טווח תשובה</div>
        <ConfigProvider
          select={{
            variant: "filled",
          }}
        >
          <div className={style["range-grid"]}>
            <ScaleField
              label="הערך הנמוך ביותר"
              badgeClass="min"
              options={MIN_OPTIONS}
              title={question?.min?.title ?? ""}
              value={question?.min?.value ?? 0}
              onTitleChange={(v) => updateScale("min", { title: v })}
              onValueSelect={(v) => updateScale("min", { value: v })}
              onClear={() => updateScale("min", { title: "" })}
            />

            <ScaleField
              label="הערך הגבוה ביותר"
              badgeClass="max"
              options={MAX_OPTIONS}
              title={question?.max?.title ?? ""}
              value={question?.max?.value ?? 20}
              onTitleChange={(v) => updateScale("max", { title: v })}
              onValueSelect={(v) => updateScale("max", { value: v })}
              onClear={() => updateScale("max", { title: "" })}
            />
          </div>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default ScaleQuestion;
