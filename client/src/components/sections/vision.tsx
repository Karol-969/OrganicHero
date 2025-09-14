export default function Vision() {
  return (
    <section id="vision" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 scroll-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our Vision: Democratizing SEO</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            We're leveling the playing field. Organic Hero provides the power of a professional SEO agency to small and medium-sized businesses at a fraction of the cost.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-card p-8 rounded-xl shadow-md border border-border scroll-fade-in">
            <h3 className="text-2xl font-semibold text-foreground">The Problem</h3>
            <p className="mt-2 text-muted-foreground">
              Most businesses struggle with the complexity and cost of SEO. They lack the time and expertise for in-depth keyword research, competitor analysis, and technical optimization.
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-xl shadow-md border border-border scroll-fade-in">
            <h3 className="text-2xl font-semibold text-foreground">The Solution</h3>
            <p className="mt-2 text-muted-foreground">
              Organic Hero addresses this by using a multi-agent AI system to perform these tasks automatically, delivering a detailed, personalized plan for organic growth.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
