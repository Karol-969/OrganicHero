import AccordionCustom from "@/components/ui/accordion-custom";
import { Search, Brain, FileText, Link, Cog, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const operations = [
  {
    id: "audit",
    title: "On-Page SEO Audit",
    subtitle: "Comprehensive analysis of technical SEO factors",
    icon: Search,
    color: "from-blue-400 to-cyan-600",
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
    icon: Brain,
    color: "from-purple-400 to-indigo-600",
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
    icon: FileText,
    color: "from-green-400 to-emerald-600",
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
    icon: Link,
    color: "from-orange-400 to-red-600",
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
    <section id="operations" className="relative py-20 md:py-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full opacity-10 animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-tr from-indigo-400 to-purple-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-5 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 scroll-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Cog className="w-4 h-4" />
            Operational Excellence
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Core{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Operations
            </span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Dive deep into each agent's{' '}
            <span className="text-blue-600 font-semibold">specialized capabilities</span> and see how they work together to optimize your website.
          </p>
        </div>

        {/* Enhanced Operation Cards */}
        <div className="max-w-6xl mx-auto space-y-6">
          {operations.map((operation, index) => {
            const Icon = operation.icon;
            return (
              <div key={operation.id} className="scroll-fade-in">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                  {/* Header */}
                  <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-6">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${operation.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-foreground">{operation.title}</h3>
                          <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800`}>
                            Step {index + 1}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-lg">{operation.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="grid md:grid-cols-2 gap-4">
                      {operation.content.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors group">
                          <div className="flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Call to Action */}
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm">AI-powered automation available</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer">
                          <span className="text-sm">Learn More</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Process Summary */}
        <div className="mt-16 scroll-fade-in">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Comprehensive SEO Operations</h3>
              <p className="text-blue-100 max-w-3xl mx-auto text-lg">
                Our four core operations work in perfect harmony to deliver a complete SEO transformation for your website
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {operations.map((operation, index) => {
                const Icon = operation.icon;
                return (
                  <div key={operation.id} className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">{operation.title}</h4>
                    <p className="text-blue-100 text-sm">{operation.content.length} specialized capabilities</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-6 py-3">
                <Cog className="w-5 h-5" />
                <span className="font-medium">Fully Automated Process</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
