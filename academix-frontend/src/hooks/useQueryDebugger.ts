export function useQueryDebugger(queryClient: any, seconds: number) {
  const interval = setInterval(() => {
    const queries = queryClient.getQueryCache().getAll();
    console.warn("=== QUERY CACHE ===");
    queries.forEach((query: any) => {
      console.warn(
        `${query.queryKey.join(" - ")}:`,
        query.state.data ? "✓" : "✗",
        query.state.status,
        query.state.data ? "data=>" : "",
        query.state.data
      );
    });
    console.warn(
      "==============================================================================================="
    );
  }, seconds * 1000);

  return interval;
}
