import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SmartCampaignBuilder({ open, onClose }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      navigate('/create-ad');
      onClose();
    }
  }, [open, navigate, onClose]);

  return null;
}
