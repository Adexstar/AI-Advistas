import { glowNaturally } from "./glowNaturally";
import { shipFaster } from "./shipFaster";
import { thirtyDayReset } from "./thirtyDayReset";
import { BULK_ORIGINALS } from "./bulk";
import type { OriginalTemplateModule } from "../templateBuilder";

export const ADVISTA_ORIGINALS: OriginalTemplateModule[] = [
  glowNaturally,
  shipFaster,
  thirtyDayReset,
  ...BULK_ORIGINALS,
];
