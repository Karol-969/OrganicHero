import { useChart } from "@/hooks/use-chart";
import { useEffect, useRef } from "react";
import { BarChart3, TrendingUp, Eye, Users, Target, Zap, Monitor, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    number: "1",
    title: "Automated SEO Audits",
    description: "Continuous monitoring and analysis of your website's SEO health with actionable recommendations",
    icon: Monitor,
    color: "from-blue-400 to-cyan-600"
  },
  {
    number: "2", 
    title: "Competitor Intelligence",
    description: "Track competitor strategies and identify opportunities to outrank them in search results",
    icon: Eye,
    color: "from-purple-400 to-indigo-600"
  },
  {
    number: "3",
    title: "Content Optimization", 
    description: "AI-powered content suggestions to improve rankings and engage your target audience effectively",
    icon: Zap,
    color: "from-green-400 to-emerald-600"
  },
  {
    number: "4",
    title: "Performance Tracking",
    description: "Real-time dashboards and detailed reports to measure your SEO success and ROI",
    icon: TrendingUp,
    color: "from-orange-400 to-red-600"
  }
];

export default function Product() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const { initializeChart, destroyChart } = useChart();
  // Chart lifecycle has been fixed to prevent reuse errors

  useEffect(() => {
    if (chartRef.current) {
      initializeChart(chartRef.current, {
        labels: ['Organic Traffic', 'Direct Traffic', 'Referral Traffic', 'Social Traffic'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: [
            'hsl(215 70% 60%)',
            'hsl(215 100% 80%)',
            'hsl(210 8% 85%)',
            'hsl(45 50% 85%)'
          ],
          borderWidth: 0
        }]
      });
    }

    // Cleanup function to destroy chart when component unmounts or re-renders
    return () => {
      destroyChart();
    };
  }, [initializeChart, destroyChart]);

  return (
    <section id="product" className="relative py-20 md:py-32 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full opacity-10 animate-pulse delay-500"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full opacity-5 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 scroll-fade-in">
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BarChart3 className="w-4 h-4" />
            Product Intelligence
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            The{' '}
            <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Product
            </span>
          </h2>
          <h3 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-6">Real-Time SEO Intelligence</h3>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Get instant insights into your SEO performance with our{' '}
            <span className="text-orange-600 font-semibold">comprehensive dashboard</span> and reporting system.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Enhanced Chart Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 scroll-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">SEO Performance Overview</h3>
                <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                  Live Analytics
                </Badge>
              </div>
            </div>
            
            <div className="chart-container bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <canvas ref={chartRef} data-testid="seo-chart"></canvas>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-xl text-center border border-green-200 dark:border-green-800">
                <div className="text-3xl font-bold text-green-600 mb-1">+245%</div>
                <div className="text-sm text-green-700 dark:text-green-300 font-medium">Organic Traffic</div>
                <div className="text-xs text-muted-foreground mt-1">vs. last month</div>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                <div className="text-3xl font-bold text-blue-600 mb-1">#3</div>
                <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Avg. Ranking</div>
                <div className="text-xs text-muted-foreground mt-1">from #47</div>
              </div>
            </div>
          </div>

          {/* Enhanced Features Section */}
          <div className="space-y-6 scroll-fade-in">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group" data-testid={`feature-${index}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-foreground">{feature.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Step {feature.number}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">AI-powered automation</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Demo Section */}
        <div className="mt-16 scroll-fade-in">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Real-Time Dashboard Preview</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">Experience the power of AI-driven SEO intelligence with live data visualization and actionable insights</p>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Live Monitoring</h4>
                <p className="text-orange-100">24/7 automated SEO health checks and instant alerts</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Smart Targeting</h4>
                <p className="text-orange-100">AI identifies the best opportunities for quick wins</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">User-Friendly</h4>
                <p className="text-orange-100">No technical expertise required - simple, actionable reports</p>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-6 py-3">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Complete SEO Intelligence Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
