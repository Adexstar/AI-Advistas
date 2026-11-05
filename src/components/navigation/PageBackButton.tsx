import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PageBackButton({ fallback, label = 'Back' }: { fallback: string; label?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="mt-0.5 h-8 w-8 shrink-0"
      aria-label={label}
      onClick={() => {
        if (location.key !== 'default') navigate(-1);
        else navigate(fallback);
      }}
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
}
