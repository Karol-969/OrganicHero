import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

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
}

interface CheckoutFormProps {
  plan: SubscriptionPlan;
  userEmail: string;
  userName: string;
}

function CheckoutForm({ plan, userEmail, userName }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to your new subscription!",
        });
        setLocation('/');
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="form-checkout">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4" data-testid="heading-payment-details">Payment Details</h3>
          <PaymentElement />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!stripe || isProcessing}
          data-testid="button-confirm-payment"
        >
          {isProcessing ? "Processing..." : `Subscribe to ${plan.name} - $${plan.priceMonthly}/month`}
        </Button>
      </div>
    </form>
  );
}

export default function Subscribe() {
  const [location, setLocation] = useLocation();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  // Get plan from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const selectedPlanName = searchParams.get('plan') || 'basic';

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  const selectedPlan = plans?.find(p => p.name.toLowerCase() === selectedPlanName.toLowerCase());

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { planName: string; userEmail: string; userName: string }) => {
      const response = await apiRequest("POST", "/api/get-or-create-subscription", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else if (data.demoMode) {
        toast({
          title: "Demo Mode",
          description: data.message || "Stripe not configured. This is a demo.",
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create subscription");
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleStartSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail || !userName) {
      setError("Please fill in all fields");
      return;
    }

    if (!selectedPlan) {
      setError("Selected plan not found");
      return;
    }

    setError("");
    createSubscriptionMutation.mutate({
      planName: selectedPlan.name,
      userEmail,
      userName
    });
  };

  if (!selectedPlan) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Plan Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">The selected subscription plan could not be found.</p>
            <Button onClick={() => setLocation('/pricing')} data-testid="button-back-to-pricing">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/pricing')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card data-testid="card-plan-summary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" data-testid="title-plan-summary">
                <Badge variant="outline">{selectedPlan.name}</Badge>
                Plan Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Monthly Price:</span>
                <span className="text-2xl font-bold" data-testid="price-monthly">
                  ${selectedPlan.priceMonthly}/month
                </span>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Included Features:</h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2" data-testid={`feature-${index}`}>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Monthly Limits:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg" data-testid="limit-analyses">
                      {selectedPlan.maxAnalyses || '∞'}
                    </div>
                    <div className="text-muted-foreground">Analyses</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg" data-testid="limit-keywords">
                      {selectedPlan.maxKeywords || '∞'}
                    </div>
                    <div className="text-muted-foreground">Keywords</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg" data-testid="limit-competitors">
                      {selectedPlan.maxCompetitors || '∞'}
                    </div>
                    <div className="text-muted-foreground">Competitors</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Form */}
          <Card data-testid="card-subscription-form">
            <CardHeader>
              <CardTitle data-testid="title-subscription-form">Subscribe to {selectedPlan.name}</CardTitle>
              <CardDescription data-testid="description-subscription-form">
                Enter your details to start your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!clientSecret ? (
                <form onSubmit={handleStartSubscription} className="space-y-4">
                  <div>
                    <Label htmlFor="userName">Name</Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      data-testid="input-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      data-testid="input-email"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" data-testid="alert-error">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createSubscriptionMutation.isPending}
                    data-testid="button-continue"
                  >
                    {createSubscriptionMutation.isPending ? "Setting up..." : "Continue to Payment"}
                  </Button>
                </form>
              ) : (
                <div>
                  {stripePromise && clientSecret ? (
                    <Elements stripe={stripePromise} options={stripeOptions}>
                      <CheckoutForm 
                        plan={selectedPlan} 
                        userEmail={userEmail} 
                        userName={userName} 
                      />
                    </Elements>
                  ) : (
                    <Alert data-testid="alert-stripe-not-configured">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Stripe is not properly configured. This is a demo environment.
                        <br />
                        Configure VITE_STRIPE_PUBLIC_KEY to enable payment processing.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}