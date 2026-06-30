/** Kết quả Server Action dạng discriminated union — không throw cho lỗi nghiệp vụ. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(message: string): ActionResult<never> {
  return { ok: false, message };
}
