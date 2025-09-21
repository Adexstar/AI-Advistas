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
      features: [
        "3 active campaigns",
        "5 AI generations/day",
        "2 template downloads",
        "Email support"
      ],
      planKey: "free",
      current: currentPlan === "free",
      popular: false
    },
    {
      name: "Pro",
      price: 29,
      credits: 500,
      features: [
        "50 active campaigns",
        "100 AI generations/day",
        "50 template downloads",
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
      features: [
        "Unlimited campaigns",
        "Unlimited AI generations",
        "Unlimited template downloads",
        "24/7 phone support",
        "Custom integrations",
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan & Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan: {subscriptionPlans.find(p => p.current)?.name || 'Free'}
          </CardTitle>
          <CardDescription>
            Your usage limits and current consumption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''} ${plan.current ? 'bg-muted/50' : ''}`}>
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
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.credits} monthly credits included
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
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
                      `Upgrade to ${plan.name}`
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
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Payment Method</span>
            <span className="text-sm">Flutterwave (Cards, Bank Transfer, USSD)</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Billing Cycle</span>
            <span className="text-sm">Monthly</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Next Billing Date</span>
            <span className="text-sm">{currentPlan !== 'free' ? 'TBD after upgrade' : 'N/A'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;