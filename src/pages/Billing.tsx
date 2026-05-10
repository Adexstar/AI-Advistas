import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Billing = () => {
  const { user } = useAuth();
  const { currentPlan, loading, getUsageForFeature, getLimitForFeature } = usePlan();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  
  const subscriptionPlans = [
    {
      name: "Free",
      price: 0,
      credits: 50,
      description: "For learning the workspace and launching a first campaign flow.",
      features: [
        "3 active campaigns",
        "5 AI drafts per day",
        "2 template exports",
        "Basic email support"
      ],
      planKey: "free",
      current: currentPlan === "free",
      popular: false
    },
    {
      name: "Pro",
      price: 29,
      credits: 500,
      description: "For operators running regular launches across the editor, library, and campaign surface.",
      features: [
        "50 active campaigns",
        "100 AI drafts per day",
        "50 template exports",
        "Saved templates and recent history",
        "Priority support",
        "A/B testing",
        "Advanced analytics"
      ],
      planKey: "pro",
      current: currentPlan === "pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: 99,
      credits: 2000,
      description: "For teams managing larger creative systems, approvals, and higher launch volume.",
      features: [
        "Unlimited campaign operations",
        "Unlimited AI drafts",
        "Unlimited template exports",
        "24/7 phone support",
        "Custom integrations",
        "Admin template workflows",
        "White-label options",
        "API access"
      ],
      planKey: "enterprise",
      current: currentPlan === "enterprise",
      popular: false
    }
  ];

  const handleUpgrade = async (planKey: string) => {
    if (!user || planKey === currentPlan) return;

    setUpgrading(planKey);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: planKey,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0]
        }
      });

      if (error) throw error;

      // Redirect to Flutterwave checkout
      window.open(data.checkout_url, '_blank');
      
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-8 py-4 md:py-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Plan Controls</h1>
        <p className="text-muted-foreground mt-2">
          Keep credits, limits, and plan access aligned with how your team creates, launches, and operates campaigns.
        </p>
      </div>

      <Card className="border-border/80 shadow-card">
        <CardHeader className="space-y-3 p-5 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan: {subscriptionPlans.find(p => p.current)?.name || 'Free'}
          </CardTitle>
          <CardDescription>
            Track the workspace limits that shape AI drafting, active campaigns, and template usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-5 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>AI Generations</span>
                <span>
                  {getUsageForFeature('ai_generations')} / {getLimitForFeature('ai_generations') === -1 ? '∞' : getLimitForFeature('ai_generations')}
                </span>
              </div>
              <Progress 
                value={getLimitForFeature('ai_generations') === -1 ? 0 : (getUsageForFeature('ai_generations') / getLimitForFeature('ai_generations')) * 100} 
                className="h-2" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Campaigns</span>
                <span>
                  {getUsageForFeature('active_campaigns')} / {getLimitForFeature('active_campaigns') === -1 ? '∞' : getLimitForFeature('active_campaigns')}
                </span>
              </div>
              <Progress 
                value={getLimitForFeature('active_campaigns') === -1 ? 0 : (getUsageForFeature('active_campaigns') / getLimitForFeature('active_campaigns')) * 100} 
                className="h-2" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Template Downloads</span>
                <span>
                  {getUsageForFeature('template_downloads')} / {getLimitForFeature('template_downloads') === -1 ? '∞' : getLimitForFeature('template_downloads')}
                </span>
              </div>
              <Progress 
                value={getLimitForFeature('template_downloads') === -1 ? 0 : (getUsageForFeature('template_downloads') / getLimitForFeature('template_downloads')) * 100} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card className="border-border/80 shadow-card">
        <CardHeader className="space-y-3 p-5 sm:p-6">
          <CardTitle>Workspace Plans</CardTitle>
          <CardDescription>
            Choose the plan that matches your launch pace, template usage, and campaign operations load.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {subscriptionPlans.map((plan, index) => (
              <Card key={index} className={`relative h-full border-border/80 shadow-sm ${plan.popular ? 'ring-2 ring-primary' : ''} ${plan.current ? 'bg-muted/50' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    <Star className="mr-1 h-3 w-3" />
                    Most Popular
                  </Badge>
                )}
                {plan.current && (
                  <Badge variant="secondary" className="absolute -top-2 right-4">
                    Current Plan
                  </Badge>
                )}
                <CardHeader className="space-y-3 p-5 sm:p-6">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {plan.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {plan.credits} monthly credits included
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm leading-6">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.current ? "secondary" : "default"}
                    disabled={plan.current || upgrading === plan.planKey}
                    onClick={() => handleUpgrade(plan.planKey)}
                  >
                    {upgrading === plan.planKey ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : plan.current ? (
                      "Current Plan"
                    ) : (
                      `Move to ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Details</CardTitle>
          <CardDescription>
            Payment and renewal details for the current workspace subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Payment Method</span>
            <span className="text-sm">Flutterwave checkout for cards, bank transfer, and USSD</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Billing Cycle</span>
            <span className="text-sm">Monthly</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Next Billing Date</span>
            <span className="text-sm">{currentPlan !== 'free' ? 'TBD after upgrade' : 'N/A'}</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 text-sm leading-6 text-muted-foreground">
            Need a higher-volume setup or a custom rollout? Upgrade here first, then use Settings to connect platforms and align your workspace for launch.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;