// AdVista service layer entrypoint. Import from "@/services".
export { TemplateService } from "./templates/TemplateService";
export { TemplateEngine } from "./templates/TemplateEngine";
export { TemplateRecommendationService } from "./templates/TemplateRecommendationService";
export { TemplateSearchService } from "./templates/TemplateSearchService";
export { TemplateVersionService } from "./templates/TemplateVersionService";
export { TemplateUsageService } from "./templates/TemplateUsageService";
export { TemplateImportService } from "./templates/TemplateImportService";
export { TemplateExportService } from "./templates/TemplateExportService";
export { runTemplateQA, validateStructure } from "./templates/qa";
export type { TemplateQAResult } from "./templates/qa";
export { downloadTemplate, buildTemplateExport } from "./templates/templateDownload";
export * from "./templates/types";


export { MediaService } from "./media/MediaService";
export { PublishingEngine } from "./publishing/PublishingEngine";
export { BrandService } from "./brand/BrandService";
export * from "./publishing/types";
export * from "./media/types";

// Campaign Intelligence Engine — Layer 4
export {
  CampaignService,
  CampaignEventService,
  CampaignVersionService,
  CampaignAnalyticsService,
  CampaignRecommendationService,
  CampaignMemoryService,
  CampaignHealthService,
  CampaignAutomationService,
  CampaignAssetService,
} from "./campaign";
export type {
  CampaignSnapshot,
  CampaignAsset,
  CampaignVersion,
  CampaignEvent,
  CampaignMetric,
  CampaignRecommendation,
  CampaignMemoryEntry,
  CampaignHealth,
  AutomationRuleConfig,
  SmartCampaignBuilderState,
} from "./campaign";
