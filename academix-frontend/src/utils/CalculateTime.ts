export const calculateCourseLenght = (
  startTime: Date,
  courseLenght: number
): string => {
  const startDate = new Date(startTime);

  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + courseLenght);

  const formatDate = (date: Date): string => {
    const months = [
      "ינואר",
      "פברואר",
      "מרץ",
      "אפריל",
      "מאי",
      "יוני",
      "יולי",
      "אוגוסט",
      "ספטמבר",
      "אוקטובר",
      "נובמבר",
      "דצמבר",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const parseEndDateFromRange = (dateRangeString: string): Date => {

  const parts = dateRangeString.split(" - ");
  

  if (parts.length !== 2) {
    throw new Error("Invalid date range format");
  }

  const endDateString = parts[1];

  if (endDateString.includes("undefined")) return new Date();

  const [day, monthName, year] = endDateString.split(" ");

  const months = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];

  const monthIndex = months.indexOf(monthName);
  if (monthIndex === -1) {
    throw new Error("Invalid month name");
  }

  return new Date(parseInt(year), monthIndex, parseInt(day));
};