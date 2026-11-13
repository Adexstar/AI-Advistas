export function checkoutFailure(body: unknown, fallback: string): { message: string; unavailable: boolean } {
  const record = body && typeof body === "object" ? body as { error?: unknown; unavailable?: unknown; message?: unknown } : {};
  const message = typeof record.error === "string" && record.error.trim()
    ? record.error
    : typeof record.message === "string" && record.message.trim()
      ? record.message
      : fallback;
  const unavailable = record.unavailable === true || /not configured|unavailable/i.test(message);
  return { message, unavailable };
}

export async function readCheckoutError(error: unknown): Promise<{ message: string; unavailable: boolean }> {
  const context = (error as { context?: Response })?.context;
  const fallback = error instanceof Error ? error.message : "Checkout could not start.";
  if (context && typeof context.json === "function") {
    try {
      const response = typeof context.clone === "function" ? context.clone() : context;
      return checkoutFailure(await response.json(), fallback);
    } catch {
      return checkoutFailure(null, fallback);
    }
  }
  return checkoutFailure(null, fallback);
}
