import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      onSuccess?: (data: any) => void;
    };
  }
}
