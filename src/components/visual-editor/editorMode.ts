export type EditorMode = 'photo' | 'video';

export type ModeObject = { type?: string; advistaKind?: string } | null | undefined;

export type ModeTemplate = {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  platform?: string | null;
  format?: string | null;
  template_json?: unknown;
};

export function objectIsVideo(object: ModeObject): boolean {
  if (!object) return false;
  if (object.advistaKind === 'video') return true;
  return String(object.type ?? '').toLowerCase() === 'video';
}

export function designHasVideo(objects: ModeObject[]): boolean {
  return objects.some((object) => objectIsVideo(object));
}

function jsonObjects(template: ModeTemplate): ModeObject[] {
  const json = template.template_json;
  if (!json || typeof json !== 'object') return [];
  const objects = (json as { objects?: unknown }).objects;
  return Array.isArray(objects) ? objects as ModeObject[] : [];
}

/** A template is a video when its format, copy, or layers say so. */
export function templateIsVideo(template: ModeTemplate | null | undefined): boolean {
  if (!template) return false;
  const format = String(template.format ?? '').toLowerCase();
  if (/\bvideo\b|\breel\b|\bstory\b/.test(format) && /video|reel/.test(format)) return true;
  if (format === 'video' || format.includes('video')) return true;
  const blob = `${template.name ?? ''} ${template.description ?? ''} ${template.category ?? ''} ${template.platform ?? ''}`.toLowerCase();
  if (/\bvideo\b|\breels?\b|\btiktok\b/.test(blob)) return true;
  return jsonObjects(template).some((object) => objectIsVideo(object));
}

/**
 * Photo designs list photo templates. Video templates appear when the Video
 * filter is on, or when the query itself contains "video".
 */
export function visibleTemplates<T extends ModeTemplate>(templates: T[], query: string, videoOnly: boolean): T[] {
  const term = query.trim().toLowerCase();
  const queryWantsVideo = term.includes('video');
  return templates.filter((template) => {
    const video = templateIsVideo(template);
    if (videoOnly && !video) return false;
    if (video && !videoOnly && !queryWantsVideo) return false;
    if (!term) return true;
    const haystack = `${template.name ?? ''} ${template.description ?? ''} ${template.category ?? ''} ${template.platform ?? ''} ${template.format ?? ''}`.toLowerCase();
    return haystack.includes(term);
  });
}

/** Stay in video while a video template is open, and drop back once every video is gone. */
export function resolveEditorMode(hasVideo: boolean, openedAsVideo: boolean, sawVideo: boolean): { mode: EditorMode; openedAsVideo: boolean; sawVideo: boolean } {
  if (hasVideo) return { mode: 'video', openedAsVideo: true, sawVideo: true };
  if (sawVideo) return { mode: 'photo', openedAsVideo: false, sawVideo: false };
  if (openedAsVideo) return { mode: 'video', openedAsVideo: true, sawVideo: false };
  return { mode: 'photo', openedAsVideo: false, sawVideo: false };
}
