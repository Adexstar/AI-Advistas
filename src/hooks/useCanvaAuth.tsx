import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCanvaAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  // Check if user has Canva connected
  const { data: connectionStatus, isLoading } = useQuery({
    queryKey: ['canva-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_canva_tokens')
        .select('id, expires_at')
        .maybeSingle();

      if (error) {
        console.error('Error checking Canva connection:', error);
        return { isConnected: false };
      }

      if (!data) {
        return { isConnected: false };
      }

      // Check if token is expired
      const isExpired = new Date(data.expires_at) < new Date();
      
      return {
        isConnected: true,
        isExpired,
      };
    },
  });

  // Initiate OAuth flow
  const initiateConnection = async () => {
    try {
      setIsConnecting(true);
      
      const { data, error } = await supabase.functions.invoke('canva-auth-init');
      
      if (error) {
        throw error;
      }

      // Store state in sessionStorage for CSRF protection
      sessionStorage.setItem('canva_oauth_state', data.state);
      
      // Redirect to Canva authorization
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Failed to initiate Canva connection:', error);
      toast.error(`Failed to connect to Canva: ${error.message}`);
      setIsConnecting(false);
    }
  };

  // Handle OAuth callback
  const handleCallback = useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      // Verify state matches
      const savedState = sessionStorage.getItem('canva_oauth_state');
      if (savedState !== state) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      const origin = window.location.origin;
      const redirectUri = `${origin}/auth/canva/callback`;

      const { data, error } = await supabase.functions.invoke('canva-auth-callback', {
        body: { code, state, redirectUri },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      sessionStorage.removeItem('canva_oauth_state');
      queryClient.invalidateQueries({ queryKey: ['canva-connection'] });
      queryClient.invalidateQueries({ queryKey: ['canva-templates'] });
      toast.success('Canva account connected successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to complete Canva connection:', error);
      toast.error(`Failed to connect: ${error.message}`);
    },
  });

  // Disconnect Canva
  const disconnect = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_canva_tokens')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canva-connection'] });
      queryClient.invalidateQueries({ queryKey: ['canva-templates'] });
      toast.success('Canva account disconnected');
    },
    onError: (error: any) => {
      console.error('Failed to disconnect Canva:', error);
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  return {
    connectionStatus,
    isLoading,
    isConnecting,
    initiateConnection,
    handleCallback,
    disconnect,
  };
};
