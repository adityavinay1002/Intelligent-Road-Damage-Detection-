import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function MonthlyTrendChart({ data = [] }) {
  const labels = data.map(item => item.month);
  const counts = data.map(item => item.detections);

  const chartData = {
    labels: labels.length ? labels : ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        fill: true,
        label: 'Damage Detections',
        data: counts.length ? counts : [12, 19, 15, 25, 32, 45],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        tension: 0.4,
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#0f172a',
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}
