import { createContext, useContext, useReducer, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

// Types
export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  platform: string[];
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  adContent?: AdContent;
}

export interface Ad {
  id: string;
  name: string;
  campaignId: string;
  status: 'active' | 'paused' | 'draft';
  format: 'image' | 'video' | 'carousel';
  impressions: number;
  clicks: number;
  ctr: number;
  content: AdContent;
  createdAt: string;
}

export interface AdContent {
  product: string;
  details: string;
  websiteUrl: string;
  adType: 'image' | 'video' | 'carousel';
  platforms: string[];
  audience: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  headline?: string;
  description?: string;
  cta?: string;
  placementOptions?: Record<string, string[]>;
  simpleAudience?: string;
}

export interface AppState {
  campaigns: Campaign[];
  ads: Ad[];
  selectedCampaign: Campaign | null;
  selectedAd: Ad | null;
  isLoading: boolean;
  activeMetric: 'impressions' | 'clicks' | 'ctr' | 'conversions';
  timeRange: '7days' | '30days' | '90days';
}

// Actions
type AppAction =
  | { type: 'CREATE_CAMPAIGN'; payload: Omit<Campaign, 'id' | 'createdAt'> }
  | { type: 'UPDATE_CAMPAIGN'; payload: { id: string; updates: Partial<Campaign> } }
  | { type: 'DELETE_CAMPAIGN'; payload: string }
  | { type: 'CREATE_AD'; payload: Omit<Ad, 'id' | 'createdAt'> }
  | { type: 'UPDATE_AD'; payload: { id: string; updates: Partial<Ad> } }
  | { type: 'DELETE_AD'; payload: string }
  | { type: 'SELECT_CAMPAIGN'; payload: Campaign | null }
  | { type: 'SELECT_AD'; payload: Ad | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_METRIC'; payload: AppState['activeMetric'] }
  | { type: 'SET_TIME_RANGE'; payload: AppState['timeRange'] }
  | { type: 'TOGGLE_CAMPAIGN_STATUS'; payload: string }
  | { type: 'TOGGLE_AD_STATUS'; payload: string };

// Initial state with mock data
const initialState: AppState = {
  campaigns: [
    {
      id: '1',
      name: 'Summer Sale Campaign',
      status: 'active',
      platform: ['Facebook', 'Instagram'],
      budget: 2500,
      spent: 1850,
      impressions: 145200,
      clicks: 4066,
      ctr: 2.8,
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Product Launch',
      status: 'paused',
      platform: ['Google Ads', 'Instagram'],
      budget: 1800,
      spent: 1200,
      impressions: 98700,
      clicks: 3058,
      ctr: 3.1,
      startDate: '2024-01-10',
      endDate: '2024-01-25',
      createdAt: '2024-01-10T09:00:00Z'
    },
    {
      id: '3',
      name: 'Brand Awareness',
      status: 'draft',
      platform: ['LinkedIn', 'Twitter'],
      budget: 3200,
      spent: 2890,
      impressions: 267300,
      clicks: 5077,
      ctr: 1.9,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      createdAt: '2024-01-28T14:00:00Z'
    }
  ],
  ads: [
    {
      id: '1',
      name: 'Summer Collection Ad',
      campaignId: '1',
      status: 'active',
      format: 'image',
      impressions: 12300,
      clicks: 344,
      ctr: 2.8,
      content: {
        product: 'Summer Collection',
        details: 'Trending summer styles with 30% off',
        websiteUrl: 'https://example.com/summer',
        adType: 'image',
        platforms: ['Facebook', 'Instagram'],
        audience: 'Fashion enthusiasts aged 25-45'
      },
      createdAt: '2024-01-15T11:00:00Z'
    },
    {
      id: '2',
      name: 'New Product Showcase',
      campaignId: '2',
      status: 'active',
      format: 'carousel',
      impressions: 8700,
      clicks: 270,
      ctr: 3.1,
      content: {
        product: 'New Product Line',
        details: 'Innovative products launching this month',
        websiteUrl: 'https://example.com/products',
        adType: 'carousel',
        platforms: ['Google Ads', 'Instagram'],
        audience: 'Tech-savvy consumers 18-35'
      },
      createdAt: '2024-01-10T10:00:00Z'
    }
  ],
  selectedCampaign: null,
  selectedAd: null,
  isLoading: false,
  activeMetric: 'impressions',
  timeRange: '30days'
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'CREATE_CAMPAIGN':
      const newCampaign: Campaign = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        campaigns: [...state.campaigns, newCampaign]
      };

    case 'UPDATE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === action.payload.id
            ? { ...campaign, ...action.payload.updates }
            : campaign
        )
      };

    case 'DELETE_CAMPAIGN':
      return {
        ...state,
        campaigns: state.campaigns.filter(campaign => campaign.id !== action.payload),
        ads: state.ads.filter(ad => ad.campaignId !== action.payload)
      };

    case 'CREATE_AD':
      const newAd: Ad = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        ads: [...state.ads, newAd]
      };

    case 'UPDATE_AD':
      return {
        ...state,
        ads: state.ads.map(ad =>
          ad.id === action.payload.id
            ? { ...ad, ...action.payload.updates }
            : ad
        )
      };

    case 'DELETE_AD':
      return {
        ...state,
        ads: state.ads.filter(ad => ad.id !== action.payload)
      };

    case 'SELECT_CAMPAIGN':
      return {
        ...state,
        selectedCampaign: action.payload
      };

    case 'SELECT_AD':
      return {
        ...state,
        selectedAd: action.payload
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ACTIVE_METRIC':
      return {
        ...state,
        activeMetric: action.payload
      };

    case 'SET_TIME_RANGE':
      return {
        ...state,
        timeRange: action.payload
      };

    case 'TOGGLE_CAMPAIGN_STATUS':
      return {
        ...state,
        campaigns: state.campaigns.map(campaign =>
          campaign.id === action.payload
            ? {
                ...campaign,
                status: campaign.status === 'active' ? 'paused' : 'active'
              }
            : campaign
        )
      };

    case 'TOGGLE_AD_STATUS':
      return {
        ...state,
        ads: state.ads.map(ad =>
          ad.id === action.payload
            ? {
                ...ad,
                status: ad.status === 'active' ? 'paused' : 'active'
              }
            : ad
        )
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => void;
    updateCampaign: (id: string, updates: Partial<Campaign>) => void;
    deleteCampaign: (id: string) => void;
    createAd: (ad: Omit<Ad, 'id' | 'createdAt'>) => void;
    updateAd: (id: string, updates: Partial<Ad>) => void;
    deleteAd: (id: string) => void;
    selectCampaign: (campaign: Campaign | null) => void;
    selectAd: (ad: Ad | null) => void;
    toggleCampaignStatus: (id: string) => void;
    toggleAdStatus: (id: string) => void;
    setActiveMetric: (metric: AppState['activeMetric']) => void;
    setTimeRange: (range: AppState['timeRange']) => void;
  };
} | null>(null);

// Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => {
      dispatch({ type: 'CREATE_CAMPAIGN', payload: campaign });
      toast({
        title: "Campaign Created",
        description: `${campaign.name} has been created successfully.`,
      });
    },

    updateCampaign: (id: string, updates: Partial<Campaign>) => {
      dispatch({ type: 'UPDATE_CAMPAIGN', payload: { id, updates } });
      toast({
        title: "Campaign Updated",
        description: "Campaign has been updated successfully.",
      });
    },

    deleteCampaign: (id: string) => {
      dispatch({ type: 'DELETE_CAMPAIGN', payload: id });
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been deleted successfully.",
      });
    },

    createAd: (ad: Omit<Ad, 'id' | 'createdAt'>) => {
      dispatch({ type: 'CREATE_AD', payload: ad });
      toast({
        title: "Ad Created",
        description: `${ad.name} has been created successfully.`,
      });
    },

    updateAd: (id: string, updates: Partial<Ad>) => {
      dispatch({ type: 'UPDATE_AD', payload: { id, updates } });
      toast({
        title: "Ad Updated",
        description: "Ad has been updated successfully.",
      });
    },

    deleteAd: (id: string) => {
      dispatch({ type: 'DELETE_AD', payload: id });
      toast({
        title: "Ad Deleted",
        description: "Ad has been deleted successfully.",
      });
    },

    selectCampaign: (campaign: Campaign | null) => {
      dispatch({ type: 'SELECT_CAMPAIGN', payload: campaign });
    },

    selectAd: (ad: Ad | null) => {
      dispatch({ type: 'SELECT_AD', payload: ad });
    },

    toggleCampaignStatus: (id: string) => {
      dispatch({ type: 'TOGGLE_CAMPAIGN_STATUS', payload: id });
      const campaign = state.campaigns.find(c => c.id === id);
      const newStatus = campaign?.status === 'active' ? 'paused' : 'active';
      toast({
        title: "Campaign Status Updated",
        description: `Campaign is now ${newStatus}.`,
      });
    },

    toggleAdStatus: (id: string) => {
      dispatch({ type: 'TOGGLE_AD_STATUS', payload: id });
      const ad = state.ads.find(a => a.id === id);
      const newStatus = ad?.status === 'active' ? 'paused' : 'active';
      toast({
        title: "Ad Status Updated",
        description: `Ad is now ${newStatus}.`,
      });
    },

    setActiveMetric: (metric: AppState['activeMetric']) => {
      dispatch({ type: 'SET_ACTIVE_METRIC', payload: metric });
    },

    setTimeRange: (range: AppState['timeRange']) => {
      dispatch({ type: 'SET_TIME_RANGE', payload: range });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};