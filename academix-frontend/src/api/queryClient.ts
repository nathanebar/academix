import { QueryCache, QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

// Retry only what can succeed on a second try: network errors / timeouts (no response) and 5xx.
// A 4xx (bad params, 401, 403, 404...) will fail the same way: `retry: 2` made it 3 requests.
// At most 2 retries, as before.
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 2) return false;
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === undefined || status >= 500;
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onSuccess: (data, query) => {
      if(query.meta?.onSuccess) {
        query.meta.onSuccess(data)
      }
    }
  }),
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});
