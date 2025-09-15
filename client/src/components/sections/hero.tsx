import { useState, useEffect } from 'react';
import { ChevronRight, Zap, TrendingUp, Bot, Sparkles } from 'lucide-react';

export default function Hero() {
  const [animatedStats, setAnimatedStats] = useState({
    rankings: 0,
    traffic: 0,
    clients: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({
        rankings: 1,
        traffic: 300,
        clients: 500
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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
    <section id="hero" className="relative py-20 md:py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400 to-blue-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-5 animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-8 scroll-fade-in">
          <Sparkles className="w-4 h-4" />
          AI-Powered SEO Revolution
          <ChevronRight className="w-4 h-4" />
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-7xl font-bold text-foreground leading-tight scroll-fade-in">
          Achieve{' '}
          <span className="relative">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent animate-pulse">
              #1 Google Rankings
            </span>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-lg blur opacity-20 animate-pulse"></div>
          </span>
          ,{' '}
          <span className="text-primary">Autonomously</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-8 text-lg md:text-2xl text-muted-foreground max-w-4xl mx-auto scroll-fade-in leading-relaxed">
          Organic Hero is your AI-powered SEO expert, delivering a complete, actionable strategy to turn your website into a{' '}
          <span className="text-blue-600 font-semibold">top-ranking organic traffic engine</span>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center scroll-fade-in">
          <button
            onClick={() => scrollToSection("#analysis")}
            className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            data-testid="hero-cta"
          >
            <Zap className="w-5 h-5 group-hover:animate-pulse" />
            Try Free Analysis
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <button
            onClick={() => scrollToSection("#how-it-works")}
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
          >
            <Bot className="w-5 h-5" />
            See How It Works
          </button>
        </div>

        {/* Animated Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto scroll-fade-in">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
              #{animatedStats.rankings}
            </div>
            <div className="text-gray-600 dark:text-gray-300 font-medium">Google Rankings</div>
            <div className="text-sm text-muted-foreground">Average client achievement</div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
              +{animatedStats.traffic}%
            </div>
            <div className="text-gray-600 dark:text-gray-300 font-medium">Organic Traffic</div>
            <div className="text-sm text-muted-foreground">Average increase</div>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
              {animatedStats.clients}+
            </div>
            <div className="text-gray-600 dark:text-gray-300 font-medium">Success Stories</div>
            <div className="text-sm text-muted-foreground">Websites optimized</div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 scroll-fade-in">
          <p className="text-sm text-muted-foreground mb-6">Trusted by innovative businesses worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {['TechCorp', 'GrowthStartup', 'ScaleVentures', 'InnovateNow'].map((company, index) => (
              <div key={index} className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
