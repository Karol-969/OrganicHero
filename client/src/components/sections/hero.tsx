export default function Hero() {
  const scrollToSection = (href: string) => {
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      const headerHeight = 80;
      const targetPosition = targetElement.offsetTop - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="hero" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight scroll-fade-in">
          Achieve #1 Google Rankings, <span className="text-primary">Autonomously</span>.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto scroll-fade-in">
          Organic Hero is your AI-powered SEO expert, delivering a complete, actionable strategy to turn your website into a top-ranking organic traffic engine.
        </p>
        <button
          onClick={() => scrollToSection("#how-it-works")}
          className="mt-8 inline-block bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition-all transform hover:scale-105 scroll-fade-in"
          data-testid="hero-cta"
        >
          Discover How It Works
        </button>
      </div>
    </section>
  );
}
