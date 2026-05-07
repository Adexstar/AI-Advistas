import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  key: string;
}

export const useAutoSave = (
  data: any,
  onSave: (data: any) => void,
  options: AutoSaveOptions
) => {
  const { delay = 2000, enabled = true, key } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef<string>('');
  const isInitialRender = useRef(true);

  useEffect(() => {
    // Skip auto-save on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!enabled) return;

    const currentData = JSON.stringify(data);
    
    // Only save if data has actually changed
    if (currentData === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      try {
        // Save to localStorage as backup
        localStorage.setItem(`autosave_${key}`, currentData);
        
        // Call the provided save function
        onSave(data);
        
        lastSavedRef.current = currentData;
        
        toast({
          title: "Auto-saved",
          description: "Your progress has been saved automatically",
          duration: 2000,
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: "Auto-save failed",
          description: "Could not save your progress",
          variant: "destructive",
          duration: 3000,
        });
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, key, onSave]);

  const restoreFromAutoSave = (): any | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to restore auto-save:', error);
    }
    return null;
  };

  const clearAutoSave = () => {
    localStorage.removeItem(`autosave_${key}`);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return {
    restoreFromAutoSave,
    clearAutoSave,
  };
};