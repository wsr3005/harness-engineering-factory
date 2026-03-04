import type { ZodError, ZodType, ZodTypeDef } from 'zod';

import { err, ok, type Result } from './result.js';

export const parseOrThrow = <TInput, TOutput>(
  schema: ZodType<TOutput, ZodTypeDef, TInput>,
  input: TInput,
): TOutput => schema.parse(input);

export const parseOrResult = <TInput, TOutput>(
  schema: ZodType<TOutput, ZodTypeDef, TInput>,
  input: TInput,
): Result<TOutput, ZodError<TInput>> => {
  const parsed = schema.safeParse(input);
  return parsed.success ? ok(parsed.data) : err(parsed.error);
};
