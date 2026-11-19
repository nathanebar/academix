const getKey = (taskAssignmentId: number) => `answerDraft_${taskAssignmentId}`;

export const saveAnswerDraft = (taskAssignmentId: number, data: unknown) => {
  try {
    sessionStorage.setItem(getKey(taskAssignmentId), JSON.stringify(data));
  } catch {
  }
};

export const loadAnswerDraft = (taskAssignmentId: number) => {
  try {
    const raw = sessionStorage.getItem(getKey(taskAssignmentId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAnswerDraft = (taskAssignmentId: number) => {
  try {
    sessionStorage.removeItem(getKey(taskAssignmentId));
  } catch {
  }
};