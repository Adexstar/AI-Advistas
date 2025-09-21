import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_end: string;
}

interface Usage {
  feature: string;
  usage_count: number;
  last_reset: string;
}

interface PlanLimits {
  ai_generations: number;
  active_campaigns: number;
  template_downloads: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    ai_generations: 5,
    active_campaigns: 3,
    template_downloads: 2,
  },
  pro: {
    ai_generations: 100,
    active_campaigns: 50,
    template_downloads: 50,
  },
  enterprise: {
    ai_generations: -1, // unlimited
    active_campaigns: -1, // unlimited
    template_downloads: -1, // unlimited
  },
};

export const usePlan = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSubscription();
    fetchUsage();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchUsage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching usage:', error);
        return;
      }

      setUsage(data || []);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlan = (): string => {
    if (!subscription || subscription.status !== 'active') {
      return 'free';
    }

    // Check if subscription is expired
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    if (now > periodEnd) {
      return 'free';
    }

    return subscription.plan;
  };

  const getUsageForFeature = (feature: string): number => {
    const featureUsage = usage.find(u => u.feature === feature);
    return featureUsage?.usage_count || 0;
  };

  const canUse = (feature: keyof PlanLimits): boolean => {
    const currentPlan = getCurrentPlan();
    const limits = PLAN_LIMITS[currentPlan];
    const limit = limits[feature];

    // Unlimited usage
    if (limit === -1) return true;

    const currentUsage = getUsageForFeature(feature);
    return currentUsage < limit;
  };

  const incrementUsage = async (feature: keyof PlanLimits): Promise<boolean> => {
    if (!user || !canUse(feature)) return false;

    try {
      const currentUsage = getUsageForFeature(feature);
      
      const { error } = await supabase
        .from('user_usage')
        .upsert({
          user_id: user.id,
          feature,
          usage_count: currentUsage + 1,
        }, {
          onConflict: 'user_id,feature'
        });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      // Update local state
      setUsage(prev => {
        const updated = [...prev];
        const index = updated.findIndex(u => u.feature === feature);
        if (index >= 0) {
          updated[index] = { ...updated[index], usage_count: currentUsage + 1 };
        } else {
          updated.push({
            feature,
            usage_count: 1,
            last_reset: new Date().toISOString(),
          });
        }
        return updated;
      });

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const getLimitForFeature = (feature: keyof PlanLimits): number => {
    const currentPlan = getCurrentPlan();
    return PLAN_LIMITS[currentPlan][feature];
  };

  const getRemainingUsage = (feature: keyof PlanLimits): number => {
    const limit = getLimitForFeature(feature);
    if (limit === -1) return -1; // unlimited
    
    const used = getUsageForFeature(feature);
    return Math.max(0, limit - used);
  };

  return {
    subscription,
    usage,
    loading,
    currentPlan: getCurrentPlan(),
    canUse,
    incrementUsage,
    getUsageForFeature,
    getLimitForFeature,
    getRemainingUsage,
    isSubscribed: getCurrentPlan() !== 'free',
    refresh: () => {
      fetchSubscription();
      fetchUsage();
    },
  };
};