import { filters } from 'fabric';

export type ImagePreset = 'none' | 'grayscale' | 'sepia';

export type ImageAdjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  preset: ImagePreset;
};

export const neutralImageAdjustments: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  preset: 'none',
};

/** Build Fabric filters for the current image. Neutral sliders add no filter. */
export function buildImageFilters(adjust: ImageAdjustments) {
  const filtersOut = [];
  if (adjust.preset === 'grayscale') filtersOut.push(new filters.Grayscale());
  if (adjust.preset === 'sepia') filtersOut.push(new filters.Sepia());
  if (adjust.brightness) filtersOut.push(new filters.Brightness({ brightness: clamp(adjust.brightness) }));
  if (adjust.contrast) filtersOut.push(new filters.Contrast({ contrast: clamp(adjust.contrast) }));
  if (adjust.saturation) filtersOut.push(new filters.Saturation({ saturation: clamp(adjust.saturation) }));
  return filtersOut;
}

export function applyImageFilters(
  image: { filters?: unknown; applyFilters?: () => void } | null,
  canvas: { requestRenderAll?: () => void } | null,
  adjust: ImageAdjustments,
) {
  if (!image || typeof image.applyFilters !== 'function') return;
  image.filters = buildImageFilters(adjust);
  image.applyFilters();
  canvas?.requestRenderAll?.();
}

function clamp(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}
