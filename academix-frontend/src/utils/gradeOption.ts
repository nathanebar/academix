export const ratingOptions1 = {
  level1: ["מעולה", "טוב מאוד", "טוב", "סביר", "לא מספיק"],
  level2: ["מצויין", "מעולה", "טוב מאוד", "טוב", "בינוני", "חלש", "לא מספיק"],
  level3: ["מצויין", "מעולה", "טוב מאוד", "טוב", "בינוני גבוהה", "בינוני", "בינוני נמוך", "חלש", "גרוע", "לא מספיק"]
};
export const ratingOptions2 = {
  level1: ["יוצא מן הכלל", "מעל הצפוי", "בהתאם לצפוי", "מתחת לצפוי", " רחוק מהנדרש"],
  level2: ["יוצא מן הכלל", "גבוה מאוד", "גבוה", "תקין", "טעון שיפור", "נמוך","רחוק מהנדרש"],
  level3: ["יוצא מן הכלל", "מעולה", "טוב מאוד", "טוב", "כמעט טוב", "בינוני", "בינוני נמוך", "נמוך", "חלש מאוד", "רחוק מהנדרש"]
};
export const ratingOptions3 = {
  level1: ["מעולה", "טוב מאוד", "טוב", "טעון שיפור", "לא מספיק"],
  level2: ["מעולה", "טוב מאוד","טוב", "בינוני", "טעון שיפור", "חלש","לא מספיק"],
  level3: [ "מעולה", "טוב מאוד", "טוב", "כמעט טוב", "בינוני", "בינוני נמוך", "חלש","חלש מאוד", "גרוע", "לא מספיק"]
};

export const getRatingOptionByIndex = (index: number): string[] => {

  const allOptions = [
   ratingOptions1.level1, 
    ratingOptions1.level2, 
   ratingOptions1.level3,
  ratingOptions2.level1, 
    ratingOptions2.level2, 
    ratingOptions2.level3,
    ratingOptions3.level1, 
   ratingOptions3.level2, 
    ratingOptions3.level3
  ];
  

  return allOptions[index-1];
};

export const calculatePercentage = (number: number, maxValue: number): number => {
  // Validate inputs
  if (number < 1 || number > maxValue) {
    throw new Error(`Number must be between 1 and ${maxValue}`);
  }
  
  // Calculate percentage: (number / maxValue) * 100
  return Math.round((number / maxValue) * 100);
};

 export const colors = [
    '#006400', // Dark green (very satisfied)
    '#228B22', // Forest green
    '#32CD32', // Lime green
    '#90EE90', // Light green
    '#FFFF00', // Yellow (neutral)
    '#FFD700', // Gold
    '#FFA500', // Orange
    '#FF8C00', // Dark orange
    '#Ef73C',// Crimson (very dissatisfied)
    '#DC143C'  // Crimson (very dissatisfied)
  ];