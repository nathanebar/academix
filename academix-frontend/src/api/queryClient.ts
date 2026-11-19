import { QueryCache, QueryClient } from "@tanstack/react-query";

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
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});