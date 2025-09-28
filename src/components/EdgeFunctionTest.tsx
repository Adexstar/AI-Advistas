import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const EdgeFunctionTest = () => {
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [isTestingTemplate, setIsTestingTemplate] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testSearchFreepikTemplates = async () => {
    setIsTestingSearch(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-freepik-templates', {
        body: { query: 'business', page: 1, limit: 5 }
      });
      
      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search function test failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Search success:', data);
        setResults({ type: 'search', data });
        toast({
          title: "Search function working!",
          description: `Found ${data?.templates?.length || 0} templates`,
        });
      }
    } catch (err) {
      console.error('Search test error:', err);
      toast({
        title: "Search function test failed",
        description: "Check console for details",
        variant: "destructive",
      });
    } finally {
      setIsTestingSearch(false);
    }
  };

  const testGetFreepikTemplate = async () => {
    setIsTestingTemplate(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-freepik-template', {
        body: { freepik_id: '123456' }
      });
      
      if (error) {
        console.error('Template error:', error);
        toast({
          title: "Template function test failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('Template success:', data);
        setResults({ type: 'template', data });
        toast({
          title: "Template function working!",
          description: "Function responded successfully",
        });
      }
    } catch (err) {
      console.error('Template test error:', err);
      toast({
        title: "Template function test failed",
        description: "Check console for details",
        variant: "destructive",
      });
    } finally {
      setIsTestingTemplate(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Edge Function Tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={testSearchFreepikTemplates} 
            disabled={isTestingSearch}
          >
            {isTestingSearch ? 'Testing...' : 'Test Search Function'}
          </Button>
          <Button 
            onClick={testGetFreepikTemplate} 
            disabled={isTestingTemplate}
          >
            {isTestingTemplate ? 'Testing...' : 'Test Template Function'}
          </Button>
        </div>
        
        {results && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Test Results ({results.type}):</h3>
            <pre className="text-sm overflow-auto max-h-60">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};