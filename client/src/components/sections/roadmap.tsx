const roadmapItems = [
  {
    id: "phase1",
    title: "Phase 1: MVP Launch",
    period: "Q1 2024",
    description: "Launch core AI agents with basic SEO audit capabilities, keyword research, and competitor analysis features.",
    features: [
      "Multi-agent system architecture",
      "Basic SEO audit and recommendations", 
      "Keyword research and analysis",
      "Simple dashboard and reporting"
    ]
  },
  {
    id: "phase2",
    title: "Phase 2: Enhanced Intelligence",
    period: "Q2 2024", 
    description: "Advanced AI capabilities with real-time monitoring, automated content suggestions, and comprehensive competitor tracking.",
    features: [
      "Real-time SEO monitoring",
      "Advanced content optimization",
      "Comprehensive competitor intelligence",
      "API integrations and automation"
    ]
  },
  {
    id: "phase3", 
    title: "Phase 3: Enterprise Features",
    period: "Q3 2024",
    description: "Enterprise-grade features including white-label solutions, team collaboration, and advanced analytics.",
    features: [
      "Multi-user team management",
      "White-label reporting and branding",
      "Advanced analytics and insights", 
      "Enterprise security and compliance"
    ]
  },
  {
    id: "phase4",
    title: "Phase 4: AI Revolution", 
    period: "Q4 2024",
    description: "Revolutionary AI features including predictive SEO, automated implementation, and autonomous optimization.",
    features: [
      "Predictive SEO trends and opportunities",
      "Automated technical SEO implementation",
      "Autonomous content creation and optimization",
      "Advanced machine learning algorithms"
    ]
  }
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="py-20 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 scroll-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Product Roadmap</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Our strategic plan for evolving Organic Hero into the most comprehensive AI-powered SEO platform.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {roadmapItems.map((item, index) => (
            <div key={item.id} className="timeline-item relative pl-8 pb-12 scroll-fade-in" data-testid={`roadmap-${item.id}`}>
              <div className="timeline-dot absolute left-0 top-2"></div>
              <div className="bg-card p-6 rounded-xl shadow-lg border border-border ml-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                  <span className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">{item.period}</span>
                </div>
                <p className="text-muted-foreground mb-4">{item.description}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {item.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>• {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
