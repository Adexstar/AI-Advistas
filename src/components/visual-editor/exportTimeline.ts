/**
 * Client-side export. The browser records the Fabric canvas while the
 * playhead walks the project in real time. There is no ffmpeg.wasm in this app.
 *
 * Limits:
 * - Output is WebM, at about the rate of the capture stream, not faster than playback.
 * - A cross-origin video or image without CORS taints the canvas and the recording throws.
 * - The file is the picture only. Mixing <audio> or <video> sound into the same recorder
 *   made Chrome emit an empty file, so the soundtrack is not in the WebM.
 * - Duration is whatever the timeline reports, capped by the caller. Very long projects record for that many seconds.
 */

export async function recordCanvas(
  canvas: HTMLCanvasElement,
  durationSec: number,
  onTick: (time: number) => void,
  audioElements: HTMLMediaElement[] = [],
): Promise<Blob> {
  if (typeof canvas.captureStream !== 'function') {
    throw new Error('This browser cannot record a canvas.');
  }
  const scale = Math.min(1, 540 / Math.max(canvas.width, canvas.height, 1));
  const frame = document.createElement('canvas');
  frame.width = Math.max(2, Math.round(canvas.width * scale));
  frame.height = Math.max(2, Math.round(canvas.height * scale));
  const context = frame.getContext('2d');
  if (!context) throw new Error('This browser cannot record a canvas.');
  const paint = () => {
    context.drawImage(canvas, 0, 0, frame.width, frame.height);
  };
  paint();
  const stream = frame.captureStream(12);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  void audioElements;
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('The recorder stopped before the video was finished.'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });
  recorder.start(200);
  const started = performance.now();
  await new Promise<void>((resolve) => {
    const step = () => {
      const time = Math.min(durationSec, (performance.now() - started) / 1000);
      onTick(time);
      paint();
      if (time >= durationSec) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  if (recorder.state !== 'inactive') {
    recorder.requestData();
    await new Promise((resolve) => setTimeout(resolve, 120));
    recorder.stop();
  }
  const blob = await stopped;
  stream.getTracks().forEach((track) => track.stop());
  if (!blob.size) throw new Error('The recording was empty.');
  return blob;
}
