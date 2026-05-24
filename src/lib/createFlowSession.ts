import type { AdContent, CampaignDraftSettings } from '@/contexts/AppContext';

const CREATE_FLOW_SESSION_KEY = 'advista-create-flow-session';

export interface CreateFlowSession {
  initialData: Partial<AdContent> & {
    templateId?: string;
    templateName?: string;
  };
  campaignSettings?: Partial<CampaignDraftSettings>;
  isAI?: boolean;
  isTemplate?: boolean;
  isScratch?: boolean;
  templateId?: string;
  templateName?: string;
}

export const readCreateFlowSession = (): CreateFlowSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.sessionStorage.getItem(CREATE_FLOW_SESSION_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as CreateFlowSession;
  } catch {
    window.sessionStorage.removeItem(CREATE_FLOW_SESSION_KEY);
    return null;
  }
};

export const saveCreateFlowSession = (session: CreateFlowSession) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(CREATE_FLOW_SESSION_KEY, JSON.stringify(session));
};

export const clearCreateFlowSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(CREATE_FLOW_SESSION_KEY);
};