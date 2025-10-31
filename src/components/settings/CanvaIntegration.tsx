import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCanvaAuth } from '@/hooks/useCanvaAuth';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export const CanvaIntegration = () => {
  const { connectionStatus, isLoading, isConnecting, initiateConnection, disconnect } = useCanvaAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Canva Integration</CardTitle>
          <CardDescription>Connect your Canva account to access templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connectionStatus?.isConnected;
  const isExpired = connectionStatus?.isExpired;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Canva Integration
              {isConnected && !isExpired && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              )}
              {isConnected && isExpired && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Expired
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Access thousands of professional Canva templates for your ad campaigns
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features with Canva:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Browse 1000s of professional templates</li>
            <li>Import designs directly into the editor</li>
            <li>Access your personal Canva designs</li>
            <li>Edit designs with full customization</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={initiateConnection} 
              disabled={isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Connect Canva Account
                </>
              )}
            </Button>
          ) : (
            <>
              {isExpired && (
                <Button 
                  onClick={initiateConnection} 
                  disabled={isConnecting}
                  variant="default"
                  className="gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Reconnect Canva
                    </>
                  )}
                </Button>
              )}
              <Button 
                onClick={() => disconnect.mutate()} 
                disabled={disconnect.isPending}
                variant="outline"
              >
                {disconnect.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </Button>
            </>
          )}
        </div>

        {isConnected && !isExpired && (
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Your Canva account is connected. You can now browse and import Canva templates in the Template Library.
          </div>
        )}

        {isExpired && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Your Canva connection has expired. Please reconnect to continue using Canva templates.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
