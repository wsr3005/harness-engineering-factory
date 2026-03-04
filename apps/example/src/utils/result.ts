export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(value: Result<T, E>): value is { ok: true; data: T } => value.ok;

export const isErr = <T, E>(value: Result<T, E>): value is { ok: false; error: E } => !value.ok;

export const unwrap = <T, E>(value: Result<T, E>): T => {
  if (value.ok) {
    return value.data;
  }
  throw new Error('Tried to unwrap an error result');
};
