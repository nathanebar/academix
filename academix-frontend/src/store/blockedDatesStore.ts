import { create } from "zustand";
import dayjs from "dayjs";

interface BlockedDatesState {
  blockFrom: dayjs.Dayjs | null;
  setBlockFrom: (date: dayjs.Dayjs | null) => void;

  blockTo: dayjs.Dayjs | null;
  setBlockTo: (date: dayjs.Dayjs | null) => void;

  savedBlockFrom: dayjs.Dayjs | null;
  savedBlockTo: dayjs.Dayjs | null;

  setSavedBlockedDates: (from: dayjs.Dayjs | null, to: dayjs.Dayjs | null) => void;

  initFromDB: (from: dayjs.Dayjs | null, to: dayjs.Dayjs | null) => void;
  reset: () => void;
}

export const useBlockedDatesStore = create<BlockedDatesState>((set) => ({
  blockFrom: null,
  setBlockFrom: (date) => set({ blockFrom: date }),

  blockTo: null,
  setBlockTo: (date) => set({ blockTo: date }),

  savedBlockFrom: null,
  savedBlockTo: null,

  setSavedBlockedDates: (from, to) =>
    set({
      savedBlockFrom: from,
      savedBlockTo: to,
    }),

  initFromDB: (from, to) =>
    set({
      blockFrom: from,
      blockTo: to,
      savedBlockFrom: from,
      savedBlockTo: to,
    }),

  reset: () =>
    set({
      blockFrom: null,
      blockTo: null,
      savedBlockFrom: null,
      savedBlockTo: null,
    }),
}));