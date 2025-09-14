import { useCallback } from "react";

declare global {
  interface Window {
    Chart: any;
  }
}

export function useChart() {
  const initializeChart = useCallback((canvas: HTMLCanvasElement, data: any) => {
    if (typeof window !== 'undefined' && window.Chart) {
      new window.Chart(canvas, {
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
  }, []);

  return { initializeChart };
}
