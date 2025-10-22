import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, DollarSign, TrendingUp, AlertTriangle, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { NextBestActionWidget } from '@/components/dashboard/NextBestActionWidget';
import { SimpleSummaryCard } from '@/components/dashboard/SimpleSummaryCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  
  const hasCampaigns = state.campaigns && state.campaigns.length > 0;

  // Calculate key metrics
  const totalSpent = state.campaigns.reduce((acc, c) => acc + c.spent, 0);
  const totalRevenue = state.campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);
  const avgROAS = totalSpent > 0 ? (totalRevenue / totalSpent).toFixed(2) : '0.00';
  const criticalActions = 0; // Will be populated by NBA widget

  // Empty State for New Users
  if (!hasCampaigns) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Wand2 className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-2">Ready to Launch Your First Ad?</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          The fastest way to start is with our AI Quick Draft system. Describe your ad in plain language, and we'll handle the rest.
        </p>
        <Button size="lg" onClick={() => navigate('/create')} className="text-lg">
          <Plus className="h-6 w-6 mr-2" /> Start Creating an Ad Now
        </Button>
      </div>
    );
  }

  // Action-Oriented Dashboard View
  return (
    <div className="space-y-8">
      
      {/* Header with Primary CTA */}
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Your performance snapshot and recommended actions
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/create')} className="min-w-[200px] shadow-lg">
          <Plus className="h-5 w-5 mr-2" /> Create New Ad
        </Button>
      </div>

      {/* 3 Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SimpleSummaryCard 
          title="Total Spend (Today)" 
          value={`$${totalSpent.toFixed(2)}`}
          icon={DollarSign} 
          trend="Live performance tracking"
        />
        <SimpleSummaryCard 
          title="ROAS (Last 7 Days)" 
          value={avgROAS}
          icon={TrendingUp} 
          trend={parseFloat(avgROAS) > 2 ? "Performing well" : "Room for improvement"}
          variant={parseFloat(avgROAS) > 2 ? 'success' : 'default'}
        />
        <SimpleSummaryCard 
          title="Critical Alerts" 
          value={criticalActions}
          icon={AlertTriangle} 
          trend="Check recommendations below"
          variant={criticalActions > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Next Best Actions Widget */}
      <NextBestActionWidget />
      
      {/* Quick Link to Full Management */}
      <Card className="bg-muted/30">
        <CardContent className="flex justify-between items-center p-4">
          <p className="text-md font-medium text-muted-foreground">
            Looking for detailed charts or full campaign list?
          </p>
          <Button variant="link" onClick={() => navigate('/campaigns')}>
            Go to Campaigns & Ads Management →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
