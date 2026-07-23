import { useNavigate } from 'react-router-dom';
import QuickDraftPrompt from '@/components/ad/QuickDraftPrompt';
import type { AdDraftResponse } from '@/schemas/adDraftSchema';
import { saveCreateFlowSession } from '@/lib/createFlowSession';
import type { CampaignDraftSettings } from '@/contexts/AppContext';

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const createDefaultCampaignSettings = (): CampaignDraftSettings => ({
  budget: 25,
  budgetPeriod: 'daily',
  startDate: formatDateForInput(new Date()),
  endDate: formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  runContinuously: true,
});

const CreateAdEntry = () => {
  const navigate = useNavigate();

  const handleDataReady = (data: Partial<AdDraftResponse> & { templateId?: string; templateName?: string }) => {
    const createFlowState = {
      initialData: data,
      campaignSettings: createDefaultCampaignSettings(),
      isAI: !!data.aiGenerated,
      isTemplate: !!data.templateId,
      templateId: data.templateId,
    };

    saveCreateFlowSession(createFlowState);

    navigate('/ad-editor', {
      state: createFlowState,
    });
  };

  const handleDraftGenerated = (draft: AdDraftResponse) => {
    handleDataReady(draft);
  };

  const handleStartFromScratch = () => {
    navigate('/create-ad');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.1),_transparent_22%),linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,1))] py-6 sm:py-8">
      <div className="page-container">
        <QuickDraftPrompt
          onDraftGenerated={handleDraftGenerated}
          onSkip={handleStartFromScratch}
        />
      </div>
    </div>
  );
};

export default CreateAdEntry;
