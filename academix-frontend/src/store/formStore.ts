import { create } from "zustand";
import {
  BooleanQuestion,
  Matching_pairs,
  OptionQuestion,
  Question,
  QuestionType,
  ScaleQuestionType,
} from "../types/types";

interface FormStoreState {
  formId?: number;
  creator: number;
  title: string;
  description: string;
  questions: QuestionType[];
  isActive: boolean;
  show_score_per_question: boolean;
  type: "survey" | "test";
  setFormId: (formId: number) => void;
  setCreator: (creator: number) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setIsActive: (isActive: boolean) => void;
  setShow_score_per_question: (show_score_per_question: boolean) => void;
  setType: (type: "survey" | "test") => void;
  setQuestions: (questions: Array<Question>) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: number | undefined, updates: Partial<Question>) => void;
  removeQuestion: (id: number) => void;
  resetForm: () => void;
  initializeForm: (formId: number, title: string, description: string) => void;
}

export const useFormStore = create<FormStoreState>((set) => ({
  formId: undefined,
  creator: 0,
  title: "",
  description: "",
  isActive: false,
  show_score_per_question: false,
  type: "test",
  questions: [
    {
      type: "text",
      text: "",
      required: false,
      options: [],
      points: 0,
    },
    {
      type: "scale",
      text: "",
      required: false,
      options: [],
      points: 0,
    },
    {
      type: "fill_in_open",
      text: "",
      required: false,
      options: [],
      points: 0,
    },
  ],

  setFormId: (formId) => set({ formId }),
  setCreator: (creator) => set({ creator }),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setIsActive: (isActive) => set({ isActive }),
  setShow_score_per_question: (show_score_per_question) =>
    set({ show_score_per_question }),
  setType: (type) => set({ type }),
  setQuestions: (questions) => set({ questions }),

  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, { ...question, id: Date.now() }],
    })),

  updateQuestion: (id, updates) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    })),

  removeQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
    })),

  resetForm: () =>
    set({
      formId: undefined,
      title: "",
      description: "",
      isActive: false,
      questions: [],
    }),

  initializeForm: (formId, title, description) =>
    set({
      formId,
      title,
      description,
      isActive: true,
      questions: [],
    }),
}));
