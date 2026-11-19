import { describe, expect, it } from "vitest";
import { messageFromBody, readEdgeError } from "./edgeError";

describe("messageFromBody", () => {
  it("prefers the error string from a function payload", () => {
    expect(messageFromBody({ error: "OPENAI_API_KEY not configured" }, "fallback")).toBe("OPENAI_API_KEY not configured");
  });

  it("uses the fallback when the payload has no message", () => {
    expect(messageFromBody({ ok: false }, "Add a provider key")).toBe("Add a provider key");
  });
});

describe("readEdgeError", () => {
  it("reads the JSON body from a function Response", async () => {
    const response = new Response(JSON.stringify({ error: "PEXELS_API_KEY not configured" }), { status: 501 });
    const message = await readEdgeError({ context: response, message: "Edge Function returned a non-2xx status code" }, "Search failed");
    expect(message).toBe("PEXELS_API_KEY not configured");
  });
});
