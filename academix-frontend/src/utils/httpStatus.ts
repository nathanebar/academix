// Business conflict returned by the backend ("a tag with this name already exists"...).
// Contract of #13: these errors are 401 until step 3 of #13, then 409, with the same body.
// A 401 whose body is { error: "unauthenticated" } is a missing session, handled in api/axios.ts.
export const isBusinessConflict = (res?: { status?: number; data?: any } | null): boolean =>
  res?.status === 409 || (res?.status === 401 && res?.data?.error !== "unauthenticated");
