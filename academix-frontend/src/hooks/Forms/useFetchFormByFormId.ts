import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";

export const useFetchFormsByFormId = (formId?: number) => {
  const shouldFetch =
    typeof formId === "number" && !isNaN(formId) && formId > 0;

  return useQuery({
    queryKey: ["formByFormId", formId],
    queryFn: async () => {
      const { data } = await api.get(`/forms/formId/${formId}`);
      return data;
    },
    meta: {
      onSuccess: (data: any) => {
        return data;
      },
    },
    enabled: shouldFetch,
    // staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
