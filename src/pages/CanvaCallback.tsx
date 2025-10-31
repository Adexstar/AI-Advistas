import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanvaAuth } from '@/hooks/useCanvaAuth';
import { Loader2 } from 'lucide-react';

const CanvaCallback = () => {
  const navigate = useNavigate();
  const { handleCallback } = useCanvaAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      console.error('OAuth error:', error);
      navigate('/settings?canva_error=' + error);
      return;
    }

    if (code && state) {
      handleCallback.mutate(
        { code, state },
        {
          onSuccess: () => {
            navigate('/settings?canva_connected=true');
          },
          onError: () => {
            navigate('/settings?canva_error=callback_failed');
          },
        }
      );
    } else {
      navigate('/settings');
    }
  }, [handleCallback, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-lg">Connecting to Canva...</p>
      </div>
    </div>
  );
};

export default CanvaCallback;
