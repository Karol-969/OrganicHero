import { Check, Star, Zap, Building2, Crown, Sparkles, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "Perfect for small businesses getting started with SEO",
    icon: Zap,
    color: "from-green-400 to-emerald-600",
    features: [
      "1 website analysis",
      "Basic SEO audit", 
      "Keyword research (50 keywords)",
      "Email support"
    ],
    cta: "Get Started",
    featured: false,
    savings: null
  },
  {
    id: "professional", 
    name: "Professional",
    price: "$79",
    period: "/mo",
    description: "Ideal for growing businesses wanting comprehensive SEO",
    icon: Building2,
    color: "from-blue-400 to-indigo-600",
    features: [
      "3 websites analysis",
      "Advanced SEO audit + monitoring",
      "Keyword research (200 keywords)",
      "Competitor analysis",
      "Priority support"
    ],
    cta: "Start Free Trial",
    featured: true,
    savings: "Save 40%"
  },
  {
    id: "enterprise",
    name: "Enterprise", 
    price: "$199",
    period: "/mo",
    description: "For large organizations needing maximum SEO power",
    icon: Crown,
    color: "from-purple-400 to-pink-600",
    features: [
      "Unlimited websites",
      "Enterprise SEO suite",
      "Unlimited keyword research",
      "White-label reporting",
      "Dedicated account manager"
    ],
    cta: "Contact Sales",
    featured: false,
    savings: "Custom pricing"
  }
];

export default function BusinessPlan() {
  const handleSelectPlan = (planId: string) => {
    console.log('Selected plan:', planId);
    // TODO: Implement plan selection logic
  };

  return (
    <section id="business" className="relative py-20 md:py-32 bg-gradient-to-br from-green-50 via-teal-50 to-blue-100 dark:from-green-950 dark:via-teal-950 dark:to-blue-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-green-400 to-teal-600 rounded-full opacity-10 animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-tr from-teal-400 to-blue-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400 to-green-600 rounded-full opacity-5 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 scroll-fade-in">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <DollarSign className="w-4 h-4" />
            Pricing & Business Plan
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            <span className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              Business Plan
            </span>
          </h2>
          <h3 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-6">Accessible SEO for Everyone</h3>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your business needs and budget. All plans include{' '}
            <span className="text-green-600 font-semibold">core AI-powered SEO analysis</span>.
          </p>
        </div>

        {/* Enhanced Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div 
                key={plan.id}
                className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group ${
                  plan.featured ? 'ring-2 ring-blue-200 dark:ring-blue-800 scale-105' : ''
                }`}
                data-testid={`pricing-${plan.id}`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    <Star className="w-4 h-4 inline mr-1" />
                    Most Popular
                  </div>
                )}
                
                {plan.savings && !plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    {plan.savings}
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="text-5xl font-bold text-foreground mb-2">
                  {plan.price}<span className="text-xl text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground mb-8 leading-relaxed">{plan.description}</p>
                
                <ul className="text-left space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                    plan.featured 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  data-testid={`select-plan-${plan.id}`}
                >
                  {plan.cta}
                </button>

                {/* Plan Benefits */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">AI-powered analysis included</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Value Proposition */}
        <div className="mt-16 scroll-fade-in">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Why Choose Organic Hero?</h3>
              <p className="text-green-100 max-w-3xl mx-auto text-lg">
                Traditional SEO agencies charge $3,000-$10,000+ per month. Get the same results with AI automation at 95% less cost.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">95% Cost Savings</h4>
                <p className="text-green-100">AI automation eliminates expensive manual SEO work</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Instant Results</h4>
                <p className="text-green-100">Get comprehensive SEO analysis in minutes, not weeks</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Professional Quality</h4>
                <p className="text-green-100">Enterprise-level SEO intelligence for every business</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Badge variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                30-day money-back guarantee
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
