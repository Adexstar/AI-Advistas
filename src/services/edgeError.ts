export function messageFromBody(body: unknown, fallback: string): string {
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  return fallback;
}

export async function readEdgeError(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.clone === "function" && typeof context.json === "function") {
    try {
      return messageFromBody(await context.clone().json(), fallback);
    } catch {
      /* The function body was not JSON. */
    }
  }
  if (error instanceof Error && error.message.trim() && !/non-2xx|edge function/i.test(error.message)) {
    return error.message.trim();
  }
  return fallback;
}
