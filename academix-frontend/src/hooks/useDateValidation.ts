import { useEffect } from "react";
import dayjs from "dayjs";
import { useSelectionsStore } from "../store/selectionStore";

const SELECTED_DATE_KEY = "selectedDate";

export function useDateValidation() {
  const { selectedDate, setSelectedDate } = useSelectionsStore();

  useEffect(() => {
    const storedDate = sessionStorage.getItem(SELECTED_DATE_KEY);
    const today = dayjs().format("YYYY-MM-DD");

    if (!storedDate) {
      localStorage.clear();
      sessionStorage.setItem(SELECTED_DATE_KEY, today);
      setSelectedDate(dayjs(today));
    } else {
      const storedDateFormatted = dayjs(storedDate).format("YYYY-MM-DD");
      if (storedDateFormatted !== today) {
        localStorage.removeItem(SELECTED_DATE_KEY);
        sessionStorage.setItem(SELECTED_DATE_KEY, today);
        setSelectedDate(dayjs(today));
      }
    }
  }, []);
}
