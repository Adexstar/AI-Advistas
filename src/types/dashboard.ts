export type WidgetKey = 'summary' | 'topCampaigns' | 'recentActivity' | 'forecast';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardWidget {
  widget: WidgetKey;
  position: WidgetPosition;
}

export type DashboardLayout = DashboardWidget[];

export interface DashboardData {
  summary: {
    totalSpend: string;
    impressions: string;
    clicks: string;
    ctr: string;
    conversions: string;
    roas: string;
  };
  topCampaigns: Array<{
    name: string;
    spend: string;
    impressions: string;
    ctr: string;
    conversions: string;
  }>;
  recentActivity: Array<{
    action: string;
    timestamp: string;
  }>;
  forecast: {
    predictedSpend: string;
    predictedImpressions: string;
    predictedConversions: string;
    confidence: string;
  };
  exportedAt?: string;
}

export interface UserDashboard {
  id: string;
  user_id: string;
  layout: DashboardLayout;
  created_at: string;
  updated_at: string;
}