import { Eye, Target, Zap, TrendingUp, Users, Shield, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Vision() {
  return (
    <section id="vision" className="relative py-20 md:py-32 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse delay-500"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-full opacity-5 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 scroll-fade-in">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Eye className="w-4 h-4" />
            Our Vision & Mission
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Democratizing{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              SEO Excellence
            </span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're leveling the playing field. Organic Hero provides the power of a{' '}
            <span className="text-emerald-600 font-semibold">professional SEO agency</span> to small and medium-sized businesses at a fraction of the cost.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* The Problem Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 scroll-fade-in group">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-400 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white transform rotate-180" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">The Problem</h3>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                  Current Challenges
                </Badge>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
              Most businesses struggle with the complexity and cost of SEO. They lack the time and expertise for in-depth keyword research, competitor analysis, and technical optimization.
            </p>

            <div className="space-y-3">
              {[
                "SEO agencies cost $3,000-$10,000+ per month",
                "Complex technical requirements and jargon",
                "Time-intensive manual research and analysis",
                "Inconsistent results and slow progress"
              ].map((challenge, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{challenge}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* The Solution Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 scroll-fade-in group">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">The Solution</h3>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                  AI-Powered Innovation
                </Badge>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
              Organic Hero addresses this by using a multi-agent AI system to perform these tasks automatically, delivering a detailed, personalized plan for organic growth.
            </p>

            <div className="space-y-3">
              {[
                "AI analysis costs 95% less than agencies",
                "Simple, jargon-free actionable insights", 
                "Automated research completed in minutes",
                "Consistent, data-driven optimization strategies"
              ].map((solution, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{solution}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vision Statement */}
        <div className="mt-16 text-center scroll-fade-in">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Empowering Every Business to Compete
            </h3>
            <p className="text-lg md:text-xl text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              By 2025, we envision a world where every business—regardless of size or budget—has access to enterprise-level SEO intelligence, 
              enabling true digital equality in the marketplace.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>10,000+ Businesses Empowered</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>300% Average Traffic Growth</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>95% Cost Reduction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
