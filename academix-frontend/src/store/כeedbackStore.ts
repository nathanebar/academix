import { create } from "zustand";

interface FeedbackCategory {
  id: number;
  feedback_id: number;
  category: string;
}

interface FeedbackQuestion {
  id: number;
  feedback_id: number;
  question_text: string;
}

interface Feedback {
  id?: number;
  name: string | null;
  select_option_score: number | null;
  team_id: number | null;
  file: string | null;
  created_by: number | null;
  is_active: boolean;
  categories?: FeedbackCategory[];
  questions?: FeedbackQuestion[];
}

interface FeedbackStoreState {
  feedback: Feedback | null;
  categories: FeedbackCategory[];
  questions: FeedbackQuestion[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setFeedback: (feedback: Feedback) => void;
  setCategories: (categories: FeedbackCategory[]) => void;
  setQuestions: (questions: FeedbackQuestion[]) => void;
  
  // CRUD for categories
  addCategory: (category: Omit<FeedbackCategory, 'id'>) => void;
  updateCategory: (id: number, updates: Partial<FeedbackCategory>) => void;
  removeCategory: (id: number) => void;
  
  // CRUD for questions
  addQuestion: (question: Omit<FeedbackQuestion, 'id'>) => void;
  updateQuestion: (id: number, updates: Partial<FeedbackQuestion>) => void;
  removeQuestion: (id: number) => void;
  
  // Reset store
  resetFeedback: () => void;
  
  // Set loading/error states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFeedbackStore = create<FeedbackStoreState>((set) => ({
  feedback: null,
  categories: [],
  questions: [],
  isLoading: false,
  error: null,
  
  setFeedback: (feedback) => set({ feedback }),
  setCategories: (categories) => set({ categories }),
  setQuestions: (questions) => set({ questions }),

  // Category operations
  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, { ...category, id: Date.now() }]
    })),
  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      )
    })),
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((cat) => cat.id !== id)
    })),
    
  // Question operations
  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, { ...question, id: Date.now() }]
    })),
  updateQuestion: (id, updates) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      )
    })),
  removeQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id)
    })),

  resetFeedback: () =>
    set({
      feedback: null,
      categories: [],
      questions: [],
      isLoading: false,
      error: null
    }),
    
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));