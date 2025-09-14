import AccordionCustom from "@/components/ui/accordion-custom";

const operations = [
  {
    id: "audit",
    title: "On-Page SEO Audit",
    subtitle: "Comprehensive analysis of technical SEO factors",
    content: [
      "Meta tags optimization and analysis",
      "Page speed and Core Web Vitals assessment", 
      "Internal linking structure evaluation",
      "Content quality and keyword density review",
      "Schema markup implementation suggestions"
    ]
  },
  {
    id: "keyword",
    title: "Keyword Research & Analysis", 
    subtitle: "Advanced keyword discovery and competitive analysis",
    content: [
      "High-volume, low-competition keyword identification",
      "Competitor keyword gap analysis",
      "Long-tail keyword opportunity mapping",
      "Search intent classification and targeting",
      "Keyword difficulty and ranking potential assessment"
    ]
  },
  {
    id: "content",
    title: "Content Strategy & Optimization",
    subtitle: "AI-driven content planning and optimization recommendations", 
    content: [
      "Topic clusters and content pillar strategies",
      "SEO-optimized title and meta description generation",
      "Content gap analysis and opportunity identification", 
      "Readability and engagement optimization",
      "Featured snippet optimization techniques"
    ]
  },
  {
    id: "link",
    title: "Link Building & Local SEO",
    subtitle: "Authority building and local search optimization",
    content: [
      "High-authority backlink opportunity identification",
      "Local citation building and NAP consistency",
      "Google Business Profile optimization",
      "Industry-specific directory submissions", 
      "Link acquisition outreach templates and strategies"
    ]
  }
];

export default function CoreOperations() {
  return (
    <section id="operations" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 scroll-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Core Operations</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Dive deep into each agent's specialized capabilities and see how they work together to optimize your website.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {operations.map((operation) => (
            <div key={operation.id} className="scroll-fade-in">
              <AccordionCustom
                title={operation.title}
                subtitle={operation.subtitle}
                content={operation.content}
                id={operation.id}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
