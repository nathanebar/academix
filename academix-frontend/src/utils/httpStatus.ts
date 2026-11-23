// Business conflict returned by the backend ("a tag with this name already exists"...).
// Contract of #13: these errors are 401 until step 3 of #13, then 409, with the same body.
// A 401 whose body is { error: "unauthenticated" } is a missing session, handled in api/axios.ts.
// Most ApiServices functions catch errors and return `error.response` instead of throwing, so the
// caller can't tell a failed save from a successful one. assertOk turns a failed response (HTTP
// error, or no response at all = network error) into an exception, for optimistic updates that
// must be rolled back.
export const assertOk = <T extends { status?: number } | null | undefined>(res: T): T => {
  const status = res?.status;
  if (status === undefined || status >= 400) {
    throw new Error(`request failed${status ? ` (${status})` : ""}`);
  }
  return res;
};

export const isBusinessConflict = (res?: { status?: number; data?: any } | null): boolean =>
  res?.status === 409 || (res?.status === 401 && res?.data?.error !== "unauthenticated");
