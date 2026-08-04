import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SeverityBarChart({ data }) {
  const chartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Detected Defects',
        data: [
          data?.['Critical'] || 0,
          data?.['High'] || 0,
          data?.['Medium'] || 0,
          data?.['Low'] || 0,
        ],
        backgroundColor: [
          '#ef4444', // Critical
          '#f97316', // High
          '#eab308', // Medium
          '#22c55e', // Low
        ],
        borderRadius: 8,
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
        ticks: { color: '#94a3b8', precision: 0 },
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
