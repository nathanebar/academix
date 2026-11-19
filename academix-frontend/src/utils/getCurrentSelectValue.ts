import {
  BooleanQuestion,
  fillInQuestion,
  Matching_pairs,
  OptionQuestion,
  Question,
  ScaleQuestionType,
} from "../types/types";

type Props = {
  question:
    | Question
    | BooleanQuestion
    | OptionQuestion
    | ScaleQuestionType
    | Matching_pairs
    | fillInQuestion;
};

type QuestionType =
  | "text"
  | "scale"
  | "description"
  | "multipleQuestion"
  | "american"
  | "fill_in_bank"
  | "fill_in_open"
  | "ordering_words"
  | "ordering_line"
  | "true_false"
  | "matching_pairs"
  | "file_upload";
type Questions = { value: number; label: string; type: QuestionType }[];
export const SELECT_OPTIONS: Questions = [
  { value: 0, label: "שאלה פתוחה", type: "text" },
  { value: 1, label: "סולם ליניארי", type: "scale" },
  { value: 10, label: "קובץ מוכן - (למבחנים מוכנים)", type: "file_upload" },
  { value: 2, label: "השלמת  מילה", type: "fill_in_open" },
  { value: 3, label: "אמריקאי", type: "american" },
  { value: 4, label: "רשת בחירה מרובה", type: "multipleQuestion" },
  { value: 5, label: "השלמת  מילה מבנק", type: "fill_in_bank" },
  { value: 6, label: "סידור שורה", type: "ordering_line" },
  { value: 7, label: "נכון /לא נכון", type: "true_false" },
  { value: 8, label: "מתח קו", type: "matching_pairs" },
  { value: 9, label: "תיאור", type: "description" },
];
export const SELECT_OPTIONS_FOR_SURVEY: Questions = [
  { value: 0, label: "שאלה פתוחה", type: "text" },
  { value: 1, label: "סולם ליניארי", type: "scale" },
  { value: 3, label: "אמריקאי", type: "american" },
  { value: 8, label: "מתח קו", type: "matching_pairs" },
  { value: 9, label: "תיאור", type: "description" },
];

export const getCurrentSelectValue = (props: any) => {
  // 🆕 any במקום Props
  if (!props.question || !props.question.type) return null;
  const foundOption = SELECT_OPTIONS.find(
    (option) => option.type === props.question.type
  );
  return foundOption ? foundOption.value : null;
};
