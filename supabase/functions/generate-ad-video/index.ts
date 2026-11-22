import { consumeAiQuota, json, requireUser } from "../_shared/guard.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Runware video is asynchronous. This function submits the job, polls for
// a short window, and returns the task id when the clip is still rendering.
// The client polls the same function with taskUUID. Sending the task again
// would start a second paid generation.
const RUNWARE_VIDEO_MODEL = "bytedance:1@1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = await requireUser(req);
  if (gate instanceof Response) return gate;

  const key = Deno.env.get("RUNWARE_API_KEY");
  if (!key) return json({ success: false, error: "Add RUNWARE_API_KEY." }, 501);

  const body = await req.json().catch(() => ({}));
  const taskUUID = typeof body.taskUUID === "string" ? body.taskUUID : "";
  if (!taskUUID) {
    const denied = await consumeAiQuota(gate.client);
    if (denied) return denied;
  }

  try {
    if (taskUUID) {
      const row = await poll(key, taskUUID);
      return json(row);
    }
    const prompt = String(body.prompt || body.product || "").trim();
    if (!prompt) return json({ success: false, error: "A prompt is required" }, 400);
    const started = await start(key, prompt, body);
    return json(started);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video generation failed";
    return json({ success: false, error: message }, 500);
  }
});

async function start(key: string, prompt: string, body: Record<string, unknown>) {
  const width = snap(Number(body.width) || 768);
  const height = snap(Number(body.height) || 768);
  const duration = [5, 8, 10, 15].includes(Number(body.duration)) ? Number(body.duration) : 5;
  const taskUUID = crypto.randomUUID();
  const first = firstHttp(body.firstFrame) || firstHttp(body.references);
  const last = typeof body.lastFrame === "string" && body.lastFrame.startsWith("http") ? body.lastFrame : "";
  const task: Record<string, unknown> = {
    taskType: "videoInference",
    taskUUID,
    deliveryMethod: "async",
    model: RUNWARE_VIDEO_MODEL,
    positivePrompt: prompt,
    width,
    height,
    duration,
    outputType: "URL",
    outputFormat: "MP4",
  };
  if (first) task.frameImages = [{ inputImage: first, frame: "first" }, ...(last ? [{ inputImage: last, frame: "last" }] : [])];
  if (body.audio === true) task.providerSettings = { audio: true };
  const data = await runware(key, [task]);
  const ready = data.find((row) => typeof row.videoURL === "string");
  if (ready?.videoURL) return { success: true, videoUrl: ready.videoURL, provider: "runware", pending: false };
  const status = await poll(key, taskUUID, 4);
  return status.videoUrl ? status : { success: true, pending: true, taskUUID, provider: "runware" };
}

async function poll(key: string, taskUUID: string, attempts = 1) {
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, 2500));
    const data = await runware(key, [{ taskType: "getResponse", taskUUID }]);
    const ready = data.find((row) => typeof row.videoURL === "string");
    if (ready?.videoURL) return { success: true, pending: false, videoUrl: ready.videoURL, taskUUID, provider: "runware" };
    const failed = data.find((row) => row.status === "error");
    if (failed) throw new Error(failed.message || "Runware video failed");
  }
  return { success: true, pending: true, taskUUID, provider: "runware" };
}

async function runware(key: string, tasks: unknown[]): Promise<Array<Record<string, string>>> {
  const res = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(tasks),
  });
  const payload = await res.json().catch(() => ({}));
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  if (!res.ok || errors.length) {
    throw new Error(errors[0]?.message || payload?.error || `Runware failed (${res.status})`);
  }
  return Array.isArray(payload?.data) ? payload.data : [];
}

function snap(value: number): number {
  const n = Number.isFinite(value) ? value : 768;
  return Math.max(256, Math.min(1280, Math.round(n / 64) * 64));
}

function firstHttp(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("http")) return value;
  if (!Array.isArray(value)) return null;
  const url = value.find((item) => typeof item === "string" && item.startsWith("http"));
  return typeof url === "string" ? url : null;
}
