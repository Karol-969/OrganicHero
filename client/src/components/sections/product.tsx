import { useChart } from "@/hooks/use-chart";
import { useEffect, useRef } from "react";

const features = [
  {
    number: "1",
    title: "Automated SEO Audits",
    description: "Continuous monitoring and analysis of your website's SEO health with actionable recommendations."
  },
  {
    number: "2", 
    title: "Competitor Intelligence",
    description: "Track competitor strategies and identify opportunities to outrank them in search results."
  },
  {
    number: "3",
    title: "Content Optimization", 
    description: "AI-powered content suggestions to improve rankings and engage your target audience effectively."
  },
  {
    number: "4",
    title: "Performance Tracking",
    description: "Real-time dashboards and detailed reports to measure your SEO success and ROI."
  }
];

export default function Product() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const { initializeChart } = useChart();

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
  }, [initializeChart]);

  return (
    <section id="product" className="py-20 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 scroll-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">The Product: Real-Time SEO Intelligence</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Get instant insights into your SEO performance with our comprehensive dashboard and reporting system.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border scroll-fade-in">
            <h3 className="text-2xl font-semibold text-foreground mb-6">SEO Performance Overview</h3>
            <div className="chart-container">
              <canvas ref={chartRef} data-testid="seo-chart"></canvas>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">+245%</div>
                <div className="text-sm text-muted-foreground">Organic Traffic</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">#3</div>
                <div className="text-sm text-muted-foreground">Avg. Ranking</div>
              </div>
            </div>
          </div>

          <div className="space-y-6 scroll-fade-in">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4" data-testid={`feature-${index}`}>
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">{feature.number}</span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-foreground">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
