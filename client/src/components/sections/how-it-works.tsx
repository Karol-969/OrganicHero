const agents = [
  {
    title: "On-Page Auditor",
    description: "Analyzes URL & SEO Fundamentals."
  },
  {
    title: "Keyword Analyst", 
    description: "Researches keywords & competitors."
  },
  {
    title: "Content Strategist",
    description: "Generates content & title ideas."
  },
  {
    title: "Link & Local SEO Agent",
    description: "Suggests backlinks & local tactics."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 scroll-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">How It Works: A Multi-Agent System</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Organic Hero is powered by a team of specialized AI agents working together to analyze, strategize, and optimize your website.
          </p>
        </div>

        {/* Desktop Architecture Diagram */}
        <div className="relative max-w-5xl mx-auto my-12 hidden md:block scroll-fade-in">
          <div className="flex items-center justify-center p-6 bg-primary rounded-full text-primary-foreground font-bold text-sm h-24 w-24 mx-auto mb-16 shadow-lg">
            User Input
          </div>
          
          <div className="flex justify-center mb-16">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-border"></div>
                <span className="absolute text-center bg-border rounded-full h-8 w-8 flex items-center justify-center -bottom-4">↓</span>
              </div>
              <div className="relative z-10 text-center bg-card p-4 rounded-xl shadow-lg border border-border agent-card">
                <h3 className="text-xl font-semibold text-foreground">Organic Hero Supervisor Agent</h3>
                <p className="text-muted-foreground text-sm mt-1">Orchestrates and delegates all tasks.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {agents.map((agent, index) => (
              <div key={index} className="agent-card text-center bg-card p-4 rounded-xl shadow-lg border border-border" data-testid={`agent-card-${index}`}>
                <h3 className="text-xl font-semibold text-foreground">{agent.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{agent.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Workflow */}
        <div className="md:hidden scroll-fade-in">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary text-primary-foreground rounded-full font-bold text-sm">User Input</div>
            <div className="h-8 w-1 bg-border"></div>
            
            <div className="p-4 bg-card rounded-xl shadow-lg border border-border text-center w-full max-w-sm">
              <h3 className="text-xl font-semibold text-foreground">Supervisor Agent</h3>
            </div>
            <div className="h-8 w-1 bg-border"></div>
            
            {agents.map((agent, index) => (
              <div key={index}>
                <div className="p-4 bg-card rounded-xl shadow-lg border border-border text-center w-full max-w-sm" data-testid={`mobile-agent-${index}`}>
                  <h3 className="text-xl font-semibold text-foreground">{agent.title}</h3>
                </div>
                {index < agents.length - 1 && <div className="h-8 w-1 bg-border"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
