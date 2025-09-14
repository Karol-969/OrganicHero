const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "API", href: "#" },
      { label: "Documentation", href: "#" }
    ]
  },
  {
    title: "Company", 
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" }
    ]
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Community", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" }
    ]
  }
];

export default function Footer() {
  const handleStartFreeTrial = () => {
    console.log('Start free trial clicked');
    // TODO: Implement trial signup flow
  };

  const handleScheduleDemo = () => {
    console.log('Schedule demo clicked');
    // TODO: Implement demo scheduling
  };

  return (
    <>
      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <div className="scroll-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">Ready to Dominate Search Rankings?</h2>
            <p className="mt-4 text-primary-foreground/90 max-w-2xl mx-auto text-lg">
              Join the SEO revolution and let AI-powered agents transform your website into a search engine magnet.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartFreeTrial}
                className="bg-card text-foreground font-semibold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition-all transform hover:scale-105"
                data-testid="cta-free-trial"
              >
                Start Free Trial
              </button>
              <button
                onClick={handleScheduleDemo}
                className="border-2 border-primary-foreground text-primary-foreground font-semibold py-3 px-8 rounded-lg hover:bg-primary-foreground hover:text-primary transition-all"
                data-testid="cta-schedule-demo"
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-foreground mb-4">
                🚀 Organic <span className="text-primary">Hero</span>
              </div>
              <p className="text-muted-foreground">
                AI-powered SEO automation for businesses that want to dominate search results.
              </p>
            </div>
            
            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href={link.href} className="hover:text-primary transition-colors" data-testid={`footer-${section.title.toLowerCase()}-${linkIndex}`}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Organic Hero. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
