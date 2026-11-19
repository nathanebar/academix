// utils/formDraftStorage.ts
const getKey = (isSurvey: boolean) =>
  `formDraft_${isSurvey ? "survey" : "form"}`;

export const saveDraft = (isSurvey: boolean, data: unknown) => {
  try {
    sessionStorage.setItem(getKey(isSurvey), JSON.stringify(data));
  } catch {
    // quota dépassé -> on ignore silencieusement
  }
};

export const loadDraft = (isSurvey: boolean) => {
  try {
    const raw = sessionStorage.getItem(getKey(isSurvey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearDraft = (isSurvey: boolean) => {
  sessionStorage.removeItem(getKey(isSurvey));
};
