import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Building2 } from "lucide-react";
import { useLocation } from "wouter";

interface SubscriptionPlan {
  id: string;
  name: string;
  stripePriceId: string;
  priceMonthly: string;
  priceYearly: string | null;
  features: string[];
  maxAnalyses: number | null;
  maxKeywords: number | null;
  maxCompetitors: number | null;
  isActive: boolean;
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Navigate to subscription page with plan selection
    setLocation(`/subscribe?plan=${plan.name.toLowerCase()}`);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <Zap className="h-6 w-6" />;
      case 'pro': return <Crown className="h-6 w-6" />;
      case 'enterprise': return <Building2 className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return 'from-blue-500 to-blue-600';
      case 'pro': return 'from-purple-500 to-purple-600';
      case 'enterprise': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly' && plan.priceYearly) {
      const monthlyEquivalent = (parseFloat(plan.priceYearly) / 12).toFixed(2);
      return {
        price: plan.priceYearly,
        period: 'year',
        monthly: monthlyEquivalent
      };
    }
    return {
      price: plan.priceMonthly,
      period: 'month',
      monthly: plan.priceMonthly
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4" data-testid="badge-pricing">
          Subscription Plans
        </Badge>
        <h1 className="text-4xl font-bold mb-4" data-testid="heading-pricing">
          Choose the Perfect Plan for Your SEO Success
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-description">
          Get unlimited access to powerful AI-driven SEO analysis tools. Start optimizing your website today.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-muted p-1 rounded-lg">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('monthly')}
            data-testid="button-monthly"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingCycle('yearly')}
            data-testid="button-yearly"
          >
            Yearly
            <Badge variant="secondary" className="ml-2">Save 16%</Badge>
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans?.map((plan) => {
          const pricing = getPrice(plan);
          const isPopular = plan.name.toLowerCase() === 'pro';
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 p-3 rounded-full bg-gradient-to-r ${getPlanColor(plan.name)}`}>
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl" data-testid={`title-${plan.name.toLowerCase()}`}>
                  {plan.name}
                </CardTitle>
                <CardDescription data-testid={`description-${plan.name.toLowerCase()}`}>
                  Perfect for {plan.name.toLowerCase() === 'basic' ? 'small businesses' : 
                             plan.name.toLowerCase() === 'pro' ? 'growing companies' : 
                             'large enterprises'}
                </CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold" data-testid={`price-${plan.name.toLowerCase()}`}>
                    ${pricing.monthly}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{billingCycle === 'monthly' ? 'mo' : 'mo'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-muted-foreground">
                      Billed ${pricing.price} annually
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3" data-testid={`feature-${plan.name.toLowerCase()}-${index}`}>
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">Monthly Limits:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold" data-testid={`limit-analyses-${plan.name.toLowerCase()}`}>
                        {plan.maxAnalyses || '∞'}
                      </div>
                      <div className="text-muted-foreground">Analyses</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold" data-testid={`limit-keywords-${plan.name.toLowerCase()}`}>
                        {plan.maxKeywords || '∞'}
                      </div>
                      <div className="text-muted-foreground">Keywords</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold" data-testid={`limit-competitors-${plan.name.toLowerCase()}`}>
                        {plan.maxCompetitors || '∞'}
                      </div>
                      <div className="text-muted-foreground">Competitors</div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan)}
                  data-testid={`button-select-${plan.name.toLowerCase()}`}
                >
                  Get Started with {plan.name}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Free Plan */}
      <div className="mt-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl" data-testid="title-free">Free Plan</CardTitle>
            <CardDescription data-testid="description-free">
              Try our basic features at no cost
            </CardDescription>
            <div className="text-2xl font-bold" data-testid="price-free">$0</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2" data-testid="feature-free-0">
                <Check className="h-4 w-4 text-green-500" />
                1 SEO analysis per month
              </li>
              <li className="flex items-center gap-2" data-testid="feature-free-1">
                <Check className="h-4 w-4 text-green-500" />
                5 keyword tracking
              </li>
              <li className="flex items-center gap-2" data-testid="feature-free-2">
                <Check className="h-4 w-4 text-green-500" />
                Basic reporting
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setLocation('/')}
              data-testid="button-select-free"
            >
              Start Free
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}