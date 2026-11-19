export const allAnswersFilled = (
  obj: Record<number, Record<number, string>>
): boolean => {
  const outerKeys = Object.keys(obj);
  if (outerKeys.length === 0) return false; // nothing was entered at all

  return outerKeys.every(taskId => {
    const inner = obj[Number(taskId)];
    // inner must exist and every cell must contain a non‑empty string
    return (
      inner &&
      Object.values(inner).every(v => v.trim().length > 0)
    );
  });
};