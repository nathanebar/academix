import { feedbackType, formType } from "../types/types";

export const getScoreCategory = (score: number | null): string => {

 
  
  if (score === null || score === undefined) return "לא הוגש";
  if (score >= 1 && score <= 20) return "(0-20)";
  if (score >= 21 && score <= 40) return "(20-40)";
  if (score >= 41 && score <= 60) return "(40-60)";
  if (score >= 61 && score <= 80) return "(60-80)";
  if (score >= 81 && score <= 100) return "(80-100)";
  return "לא הוגש";
};
export const getScoreCategoryFeedBack = (score: number | null): string => {
  if (score === null || score === undefined) return "לא הוגש";
  if (score >= 0 && score <= 10) return "לא מספיק";
  if (score >= 11 && score <= 20) return "גרוע";
  if (score >= 21 && score <= 30) return "חלש";
  if (score >= 31 && score <= 40) return "בינוני נמוך";
  if (score >= 41 && score <= 50) return "בינוני";
  if (score >= 51 && score <= 60) return "בינוני גבוה";
  if (score >= 61 && score <= 70) return "טוב";
  if (score >= 71 && score <= 80) return "טוב מאוד";
  if (score >= 81 && score <= 90) return "מעולה";
  if (score >= 91 && score <= 100) return "מצויין";
  return "לא הוגש";
};

export const getScoreColor = (score: number | null): string => {
  if (score === null || score === undefined) return "#ECE5D6";
  if (score >= 1 && score <= 40) return "#FC523E";
  if (score >= 41 && score <= 60) return "#FFA52D";
  if (score >= 61 && score <= 80) return "#FFD12D";
  if (score >= 81 && score <= 90) return "#44C7A5";
  if (score >= 91 && score <= 100) return "#29A182";
  return "#ECE5D6";
};
export const processFeedbackScoresForPieChart = (feedbacks: feedbackType[]) => {
  
  const scoreCounts: Record<string, number> = {
    "לא הוגש": 0,
    "0-20": 0,
    "20-40": 0,
    "40-60": 0,
    "60-80": 0,
    "80-100": 0,
  };

  const colorMap: Record<string, string> = {
    "לא הוגש": "#6e7072",
    "0-20": "#FC523E",
    "20-40": "#FFA52D",
    "40-60": "#FFD12D",
    "60-80": "#44C7A5",
    "80-100": "#29A182",
  };

  feedbacks.forEach((feedback) => {
    if (feedback.answers && feedback.answers.length > 0) {
      feedback.answers.forEach((answer) => {
        if (answer.summary_grade !== null && answer.summary_grade !== undefined) {
          const score = answer.summary_grade;
          if (score >= 1 && score <= 20) scoreCounts["0-20"]++;
          else if (score >= 21 && score <= 40) scoreCounts["20-40"]++;
          else if (score >= 41 && score <= 60) scoreCounts["40-60"]++;
          else if (score >= 61 && score <= 80) scoreCounts["60-80"]++;
          else if (score >= 81 && score <= 100) scoreCounts["80-100"]++;
        } else {
          scoreCounts["לא הוגש"]++;
        }
      });
    } else {
      // scoreCounts["לא הוגש"]++;
    }
  });

  const pieChartData = Object.entries(scoreCounts)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: colorMap[name],
    }));

  return {
    pieData: pieChartData,
    counts: scoreCounts,
  };
};

export const processRecentScoresForPieChart = (
  data: formType[] | feedbackType[]
) => {
  if (data?.length > 0 && "categories" in data[0]) {
    // It's feedback data - use feedback processing function
    return processFeedbackScoresForPieChart(data as feedbackType[]);
  } else {
    // It's form data - use existing logic
    const categoryCounts: Record<string, number> = {};

    const scoresTitles = [
   { title: "לא הוגש", color: "#ECE5D6" },
  { title: "(0-20)", color: "#FC523E" },
  { title: "(20-40)", color: "#FFA52D" },
  { title: "(40-60)", color: "#FFD12D" },
  { title: "(60-80)", color: "#44C7A5" },
  { title: "(80-100)", color: "#29A182" },
    ];

    

    scoresTitles.forEach(({ title, color }) => {
      categoryCounts[title] = 0;
    });

    
    const recentForms = data as formType[];
   
    recentForms?.forEach((form) => {
      if (Array.isArray(form.score)) {
        form.score.forEach((score) => {
          const category = getScoreCategory(score);
          categoryCounts[category]++;
        });
      } else {
        const category = getScoreCategory(form.scorePercentage);
        categoryCounts[category]++;
      }
    });

    const pieChartData = Object.entries(categoryCounts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );


 
    
    return {
      pieData: pieChartData,
      counts: categoryCounts,
    };
  }
};

export const groupFeedbacksByScoreCategory = (
  feedbacks: feedbackType[]
): Record<string, feedbackType[]> => {
  const groupedFeedbacks: Record<string, feedbackType[]> = {
    "לא הוגש": [],
    "לא מספיק": [],
    גרוע: [],
    חלש: [],
    "בינוני נמוך": [],
    בינוני: [],
    "בינוני גבוה": [],
    טוב: [],
    "טוב מאוד": [],
    מעולה: [],
    מצויין: [],
  };

  feedbacks.forEach((feedback) => {
    let totalScore = 0;
    let validCount = 0;

    if (feedback.answers && feedback.answers.length > 0) {
      feedback.answers.forEach((answer) => {
        if (
          answer.summary_grade !== null &&
          answer.summary_grade !== undefined
        ) {
          totalScore += answer.summary_grade;
          validCount++;
        }
      });

      if (validCount > 0) {
        const avgScore = Math.round(totalScore / validCount);
        const category = getScoreCategory(avgScore);
        if (groupedFeedbacks[category]) {
          groupedFeedbacks[category].push(feedback);
        }
      } else {
        groupedFeedbacks["לא הוגש"].push(feedback);
      }
    } else {
      groupedFeedbacks["לא הוגש"].push(feedback);
    }
  });

  return groupedFeedbacks;
};
