import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration, ChartData } from 'chart.js/auto';
import { useTheme } from '../../context/ThemeContext';

interface PerformanceMetrics {
  posture: number;
  gestures: number;
  eyeContact: number;
  voiceClarity: number;
  timestamp: number;
}

interface Props {
  data: PerformanceMetrics[];
  className?: string;
}

export default function PerformanceChart({ data, className = '' }: Props) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { themeColor } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data for the chart
    const timestamps = data.map(d => new Date(d.timestamp).toLocaleTimeString());
    const chartData: ChartData = {
      labels: timestamps,
      datasets: [
        {
          label: 'Posture',
          data: data.map(d => d.posture),
          borderColor: `${themeColor}CC`,
          backgroundColor: `${themeColor}33`,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Gestures',
          data: data.map(d => d.gestures),
          borderColor: '#4CAF50CC',
          backgroundColor: '#4CAF5033',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Eye Contact',
          data: data.map(d => d.eyeContact),
          borderColor: '#2196F3CC',
          backgroundColor: '#2196F333',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Voice Clarity',
          data: data.map(d => d.voiceClarity),
          borderColor: '#9C27B0CC',
          backgroundColor: '#9C27B033',
          fill: true,
          tension: 0.4
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              padding: 20,
              font: {
                family: 'system-ui'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'rgba(255, 255, 255, 0.9)',
            bodyColor: 'rgba(255, 255, 255, 0.9)',
            padding: 12,
            cornerRadius: 8,
            boxPadding: 6
          }
        }
      }
    };

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new Chart(ctx, config);

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, themeColor]);

  return (
    <div className={`w-full h-64 ${className}`}>
      <canvas ref={chartRef} />
    </div>
  );
}
