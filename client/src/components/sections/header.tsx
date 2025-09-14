import { useState } from "react";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "#vision", label: "Vision" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#operations", label: "Core Operations" },
  { href: "#product", label: "The Product" },
  { href: "#business", label: "Business Plan" },
  { href: "#roadmap", label: "Roadmap" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeSection = useScrollSpy(navItems.map(item => item.href.substring(1)));

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
      
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-card/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">
            🚀 Organic <span className="text-primary">Hero</span>
          </div>
          
          <nav className="hidden md:flex space-x-8 text-muted-foreground font-medium">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className={`nav-link hover:text-primary transition-colors ${
                  activeSection === item.href.substring(1) ? 'active' : ''
                }`}
                data-testid={`nav-${item.href.substring(1)}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground"
            aria-label="Toggle mobile menu"
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden px-6 pb-4 border-t border-border bg-card/95">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => scrollToSection(item.href)}
              className={`block w-full text-left py-2 nav-link hover:text-primary transition-colors ${
                activeSection === item.href.substring(1) ? 'active' : ''
              }`}
              data-testid={`mobile-nav-${item.href.substring(1)}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
