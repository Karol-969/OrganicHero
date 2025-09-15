import { Bot, Search, FileText, Link, Brain, Zap, ArrowDown, Sparkles, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const agents = [
  {
    title: "On-Page Auditor",
    description: "Analyzes URL & SEO Fundamentals",
    icon: Search,
    color: "from-blue-400 to-cyan-600",
    details: "Scans website structure, meta tags, and technical SEO factors"
  },
  {
    title: "Keyword Analyst", 
    description: "Researches keywords & competitors",
    icon: Brain,
    color: "from-purple-400 to-indigo-600",
    details: "Identifies high-impact keywords and analyzes competitor strategies"
  },
  {
    title: "Content Strategist",
    description: "Generates content & title ideas",
    icon: FileText,
    color: "from-green-400 to-emerald-600",
    details: "Creates data-driven content recommendations and optimization plans"
  },
  {
    title: "Link & Local SEO Agent",
    description: "Suggests backlinks & local tactics",
    icon: Link,
    color: "from-orange-400 to-red-600",
    details: "Finds link opportunities and optimizes local search presence"
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 md:py-32 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full opacity-10 animate-pulse delay-500"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-indigo-600 rounded-full opacity-5 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 scroll-fade-in">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Network className="w-4 h-4" />
            Multi-Agent AI System
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            How It{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Organic Hero is powered by a team of{' '}
            <span className="text-indigo-600 font-semibold">specialized AI agents</span> working together to analyze, strategize, and optimize your website.
          </p>
        </div>

        {/* Desktop Architecture Diagram */}
        <div className="relative max-w-6xl mx-auto my-16 hidden md:block scroll-fade-in">
          {/* User Input */}
          <div className="flex justify-center mb-12">
            <div className="group relative">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <div className="text-center">
                  <Bot className="w-8 h-8 mx-auto mb-2" />
                  <div>User Input</div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg"></div>
            </div>
          </div>
          
          {/* Arrow Down */}
          <div className="flex justify-center mb-12">
            <div className="text-indigo-400 animate-bounce">
              <ArrowDown className="w-8 h-8" />
            </div>
          </div>
          
          {/* Supervisor Agent */}
          <div className="flex justify-center mb-16">
            <div className="relative w-full max-w-lg">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Organic Hero Supervisor Agent</h3>
                <p className="text-muted-foreground">Orchestrates and delegates all tasks</p>
                <Badge variant="outline" className="mt-3 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                  Central Intelligence
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Agent Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent, index) => {
              const Icon = agent.icon;
              return (
                <div key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group" data-testid={`agent-card-${index}`}>
                  <div className="flex justify-center mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${agent.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{agent.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{agent.description}</p>
                  <p className="text-xs text-muted-foreground">{agent.details}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Workflow */}
        <div className="md:hidden scroll-fade-in">
          <div className="flex flex-col items-center space-y-6 max-w-sm mx-auto">
            {/* User Input */}
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xl">
              <div className="text-center">
                <Bot className="w-6 h-6 mx-auto mb-1" />
                <div>User Input</div>
              </div>
            </div>
            
            {/* Connection Line */}
            <div className="h-8 w-0.5 bg-gradient-to-b from-indigo-400 to-purple-400"></div>
            
            {/* Supervisor Agent */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center w-full">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground">Supervisor Agent</h3>
              <p className="text-sm text-muted-foreground mt-1">Central Intelligence</p>
            </div>
            
            {/* Connection Line */}
            <div className="h-8 w-0.5 bg-gradient-to-b from-purple-400 to-indigo-400"></div>
            
            {/* Agent List */}
            {agents.map((agent, index) => {
              const Icon = agent.icon;
              return (
                <div key={index}>
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center w-full" data-testid={`mobile-agent-${index}`}>
                    <div className="flex justify-center mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${agent.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{agent.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
                  </div>
                  {index < agents.length - 1 && <div className="h-6 w-0.5 bg-gradient-to-b from-gray-300 to-gray-400 mx-auto"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Process Flow */}
        <div className="mt-16 scroll-fade-in">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Intelligent Process Flow</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">Each agent specializes in a specific domain, working in harmony to deliver comprehensive SEO insights</p>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">1. Analysis</h4>
                <p className="text-indigo-100">AI agents scan and analyze your website's current SEO status</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">2. Strategy</h4>
                <p className="text-indigo-100">Agents collaborate to create a comprehensive optimization strategy</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">3. Execution</h4>
                <p className="text-indigo-100">Deliver actionable recommendations for immediate implementation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
