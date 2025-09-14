import { Check } from "lucide-react";

const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "Perfect for small businesses getting started with SEO",
    features: [
      "1 website analysis",
      "Basic SEO audit", 
      "Keyword research (50 keywords)",
      "Email support"
    ],
    cta: "Get Started",
    featured: false
  },
  {
    id: "professional", 
    name: "Professional",
    price: "$79",
    period: "/mo",
    description: "Ideal for growing businesses wanting comprehensive SEO",
    features: [
      "3 websites analysis",
      "Advanced SEO audit + monitoring",
      "Keyword research (200 keywords)",
      "Competitor analysis",
      "Priority support"
    ],
    cta: "Start Free Trial",
    featured: true
  },
  {
    id: "enterprise",
    name: "Enterprise", 
    price: "$199",
    period: "/mo",
    description: "For large organizations needing maximum SEO power",
    features: [
      "Unlimited websites",
      "Enterprise SEO suite",
      "Unlimited keyword research",
      "White-label reporting",
      "Dedicated account manager"
    ],
    cta: "Contact Sales",
    featured: false
  }
];

export default function BusinessPlan() {
  const handleSelectPlan = (planId: string) => {
    console.log('Selected plan:', planId);
    // TODO: Implement plan selection logic
  };

  return (
    <section id="business" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 scroll-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Business Plan: Accessible SEO for Everyone</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business needs and budget. All plans include core AI-powered SEO analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`pricing-card bg-card p-8 rounded-xl shadow-lg border text-center relative ${
                plan.featured ? 'featured border-primary' : 'border-border'
              }`}
              data-testid={`pricing-${plan.id}`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold text-primary mb-4">
                {plan.price}<span className="text-lg text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              
              <ul className="text-left space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-primary mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-all"
                data-testid={`select-plan-${plan.id}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
