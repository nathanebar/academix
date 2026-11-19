import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";

const useFetchForms = () => {
  return useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const { data } = await api.get("/forms");
      return data;
    },
    // אם אתה רוצה טיפול בשגיאות
 
    // אם אתה רוצה להריץ משהו אחרי הצלחה
    // השתמש ב- select או ב- onSuccess בצורה נכונה:
    staleTime: 5 * 60 * 1000,
    // cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export default useFetchForms;