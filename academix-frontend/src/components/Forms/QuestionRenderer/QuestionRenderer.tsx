import React, { useState } from "react";
import TextQuestion from "../Questions/TextQuestion/TextQuestion";
import { QuestionType } from "../../../types/types";
import ScaleQuestion from "../Questions/ScaleQuestion/ScaleQuestion";
import QuestionCard from "../QuestionCard/QuestionCard";
import AmericanQuestion from "../Questions/AmericanQuestion/AmericanQuestion";
import OrderingLine from "../Questions/OrderingLine/OrderingLine";
import True_false from "../Questions/True_false/True_false";
import Description from "../Questions/Description/Description";
import MenuCreateQuetion from "../../MenuCreateQuestion/MenuCreateQuetion";
import { SELECT_OPTIONS } from "../../../utils/getCurrentSelectValue";
import FileUploadQuestion from "../Questions/FileUploadQuestion/FileUploadQuestion";
import FillInQuestion from "../Questions/FillInBankQuestion/FillInQuestion";
import MultipleQuestions from "../Questions/MatchPair/MultipleQuestions";
import MatchingPairs from "../Questions/metrixSingle/MatchingPairs";

const QUESTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  text: TextQuestion,
  scale: ScaleQuestion,
  fill_in_open: FillInQuestion,
  fill_in_bank: FillInQuestion,
  american: AmericanQuestion,
  multipleQuestion: MultipleQuestions, // ex-matchPair
  matching_pairs: MatchingPairs, // ex-matrix_single
  ordering_line: OrderingLine,
  true_false: True_false,
  description: Description,
  file_upload: FileUploadQuestion,
};

interface QuestionRendererProps {
  questionsForEdit: { questions: QuestionType[] };
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  autoGrade: boolean;
  isSurveyPage: boolean;
}

type FieldType = {
  id: number;
  text: string;
  type: "not-changeable" | "changeable";
  isEditable?: boolean;
};

const DEFAULT_FIELDS: FieldType[] = [
  { id: 2, text: "התחלה", type: "not-changeable" },
  { id: 3, text: "הזן את המילה חסרה", type: "changeable", isEditable: true },
  { id: 4, text: "סוף", type: "not-changeable" },
];

const createBlankQuestion = (
  type: QuestionType["type"],
  points: number | null | undefined,
  tempId?: string
): QuestionType => ({
  id: tempId, // ✅ id temporaire pour identifier la nouvelle question
  text: "",
  required: false,
  points: points ?? 0,
  type,
  options: ["", "", ""],
  fields: DEFAULT_FIELDS.map((f) => ({ ...f })),
  correctedOptions: Array(4).fill(true),
  matches: [{ value1: "", value2: "" }],
  max: { value: 0, title: "" },
  min: { value: 0, title: "" },
});

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  questionsForEdit,
  setQuestionsForEdit,
  autoGrade,
  isSurveyPage,
}) => {
  const [isDraggableQuestions, setIsDraggableQustions] =
    useState<boolean>(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null); // 🆕

  const handleDelete = (i: number) => {
    const next = questionsForEdit.questions.filter((_, idx) => idx !== i);
    if (next.length === 0) return;
    setQuestionsForEdit({ questions: next });
    setSelectedQuestionIndex((prev) => {
      if (prev === i) return Math.min(i, next.length - 1);
      if (prev > i) return prev - 1;
      return prev;
    });
  };

  const cloneQuestion = (q: QuestionType): QuestionType => ({
    ...q,
    options: q.options ? [...q.options] : q.options,
    fields: q.fields ? q.fields.map((f) => ({ ...f })) : q.fields,
    matches: q.matches ? q.matches.map((m) => ({ ...m })) : q.matches,
    correctedOptions: q.correctedOptions
      ? [...q.correctedOptions]
      : q.correctedOptions,
    max: q.max ? { ...q.max } : q.max,
    min: q.min ? { ...q.min } : q.min,
  });

  const handleDuplicate = (index: number) => {
    setQuestionsForEdit((prev) => ({
      questions: [
        ...prev.questions.slice(0, index + 1),
        cloneQuestion(prev.questions[index]),
        ...prev.questions.slice(index + 1),
      ],
    }));
    setSelectedQuestionIndex(index + 1);
    setLastAddedId(null); // on revient à la sélection par index
  };

  /* ✅ AJOUT : id unique + sélection par identité (fiable) + scroll page */
  const handleAddQuestion = () => {
    const tempId = `new-${Date.now()}`;

    setQuestionsForEdit((prev) => ({
      questions: [...prev.questions, createBlankQuestion("text", 0, tempId)],
    }));

    setLastAddedId(tempId); // ✅ marque la nouvelle comme sélectionnée
    setSelectedQuestionIndex(questionsForEdit.questions.length); // au cas où

    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }, 120);
  };

  const questionSelectChanges = (value: number, questionIndex: number) => {
    const selectedOption = SELECT_OPTIONS.find(
      (option) => option.value === value
    );
    if (!selectedOption) return;

    setQuestionsForEdit((prevQuestions) => ({
      questions: prevQuestions.questions.map((question, index) => {
        if (index !== questionIndex) return question;
        return createBlankQuestion(
          selectedOption.type as QuestionType["type"],
          question.points
        );
      }),
    }));
  };

  const RefreshQuestions = () => {
    setQuestionsForEdit((prev) => ({
      questions: prev.questions.map((question, index) => {
        if (index === selectedQuestionIndex) {
          return createBlankQuestion(question.type, 0);
        }
        return question;
      }),
    }));
  };
  console.log("render:", {
    selectedIndex: selectedQuestionIndex,
    count: questionsForEdit.questions.length,
  });
  return (
    <>
      {questionsForEdit.questions.map((question, index) => {
        const QuestionComponent = QUESTION_COMPONENTS[question.type];
        // ✅ sélection : index classique OU la question fraîchement ajoutée
        const isSelected =
          question.id === lastAddedId || index === selectedQuestionIndex;

        if (!QuestionComponent) {
          return (
            <div
              key={question.id ?? `q-${index}`}
              className="bg-red-100 p-4 rounded"
            >
              <p>לא נמצאה קומפוננטה עבור סוג שאלה: {question.type}</p>
            </div>
          );
        }

        return (
          <div
            key={question.id ?? `q-${index}`}
            onClick={() => {
              setSelectedQuestionIndex(index);
              setLastAddedId(null); // clic manuel → sélection par index
            }}
            style={{
              display: "flex",
              position: "relative",
              alignItems: "flex-start",
              marginBottom: 14,
              borderRadius: 12,
              border: isSelected
                ? "3px solid #f2ddb0"
                : "3px solid transparent",
              background: isSelected ? "#fffdf6" : "transparent",
            }}
          >
            {isSelected && (
              <div
                style={{ flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()} // ✅ empêche le clic du menu de se propager à la carte
              >
                <MenuCreateQuetion
                  RefreshQuestions={RefreshQuestions}
                  setQuestionsForEdit={setQuestionsForEdit}
                  setIsDraggableQustions={setIsDraggableQustions}
                  onAddQuestion={handleAddQuestion}
                />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <QuestionCard
                setQuestionsForEdit={setQuestionsForEdit}
                isDraggableQuestions={isDraggableQuestions}
                setIsDraggableQustions={setIsDraggableQustions}
                onDuplicate={(i: number) => handleDuplicate(i)}
                onDelete={() => handleDelete(index)}
                question={question}
                questionIndex={index}
                autoGrade={autoGrade}
                isSurveyPage={isSurveyPage}
              >
                <QuestionComponent
                  onSelectChange={questionSelectChanges}
                  setQuestionsForEdit={setQuestionsForEdit}
                  question={question}
                  questionIndex={index}
                  onRemove={() => handleDelete(index)}
                  onDuplicate={() => handleDuplicate(index)}
                  existingFiles={question?.existingFiles}
                  isSurveyPage={isSurveyPage}
                />
              </QuestionCard>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default QuestionRenderer;
