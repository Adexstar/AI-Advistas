import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BatchTemplateUploader } from '@/components/admin/BatchTemplateUploader';
import { TemplateUploader } from '@/components/admin/TemplateUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data && !error);
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You do not have admin access to this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage templates and system settings
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/templates">Manage Templates</Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Template Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="batch" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="batch">Batch Upload</TabsTrigger>
              <TabsTrigger value="single">Single Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="batch" className="mt-6">
              <BatchTemplateUploader />
            </TabsContent>
            <TabsContent value="single" className="mt-6">
              <TemplateUploader />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
