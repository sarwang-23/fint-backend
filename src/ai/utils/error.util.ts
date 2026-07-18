/**
 * Safely extract error message from an unknown catch clause value.
 * TypeScript 4.4+ types catch errors as `unknown`, so direct .message access errors.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}
