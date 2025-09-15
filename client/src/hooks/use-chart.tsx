import { useCallback, useRef } from "react";

declare global {
  interface Window {
    Chart: any;
  }
}

export function useChart() {
  const chartInstanceRef = useRef<any>(null);

  const destroyChart = useCallback(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
  }, []);

  const initializeChart = useCallback((canvas: HTMLCanvasElement, data: any) => {
    if (typeof window !== 'undefined' && window.Chart) {
      // Destroy existing chart instance before creating a new one
      destroyChart();
      
      chartInstanceRef.current = new window.Chart(canvas, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: {
                padding: 20,
                usePointStyle: true
              }
            }
          }
        }
      });
    }
  }, [destroyChart]);

  return { initializeChart, destroyChart };
}
