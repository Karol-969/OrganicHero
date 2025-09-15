import { CheckCircle, Clock, Zap, Rocket, Shield, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const phaseIcons = {
  phase1: CheckCircle,
  phase2: Clock, 
  phase3: Shield,
  phase4: Brain
};

const phaseColors = {
  phase1: "from-green-400 to-emerald-600",
  phase2: "from-blue-400 to-cyan-600", 
  phase3: "from-purple-400 to-indigo-600",
  phase4: "from-orange-400 to-red-600"
};

export default function Roadmap() {
  return (
    <section id="roadmap" className="relative py-20 md:py-32 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-green-400 to-blue-600 rounded-full opacity-10 animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-5 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 scroll-fade-in">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
            Strategic Development Plan
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Product{' '}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
              Roadmap
            </span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our strategic plan for evolving Organic Hero into the most comprehensive{' '}
            <span className="text-purple-600 font-semibold">AI-powered SEO platform</span>.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 via-purple-500 to-orange-500 opacity-30"></div>
            
            {roadmapItems.map((item, index) => {
              const Icon = phaseIcons[item.id as keyof typeof phaseIcons];
              const colorGradient = phaseColors[item.id as keyof typeof phaseColors];
              const isCompleted = item.id === "phase1";
              const isInProgress = item.id === "phase2";
              
              return (
                <div key={item.id} className="relative pl-20 pb-12 scroll-fade-in group" data-testid={`roadmap-${item.id}`}>
                  {/* Timeline Dot */}
                  <div className={`absolute left-6 top-8 w-4 h-4 rounded-full bg-gradient-to-r ${colorGradient} shadow-lg transform group-hover:scale-125 transition-transform duration-300`}>
                    <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-900 opacity-20"></div>
                  </div>
                  
                  {/* Enhanced Card */}
                  <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                    isCompleted ? 'ring-2 ring-green-200 dark:ring-green-800' : 
                    isInProgress ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                  }`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorGradient} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground mb-2">{item.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"}
                              className={`${isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                         isInProgress ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}`}
                            >
                              {item.period}
                            </Badge>
                            {isCompleted && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                                ✓ Completed
                              </Badge>
                            )}
                            {isInProgress && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                                🔄 In Progress
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-6 text-lg leading-relaxed">{item.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      {item.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorGradient}`}></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Development Progress</span>
                        <span className={`font-semibold ${
                          isCompleted ? 'text-green-600' : 
                          isInProgress ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {isCompleted ? '100%' : isInProgress ? '65%' : '0%'}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${colorGradient} transition-all duration-1000 ease-out`}
                          style={{ 
                            width: isCompleted ? '100%' : isInProgress ? '65%' : '0%' 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
