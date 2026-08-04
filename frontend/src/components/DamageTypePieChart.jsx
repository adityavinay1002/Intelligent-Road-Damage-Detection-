import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DamageTypePieChart({ data }) {
  const chartData = {
    labels: ['Pothole', 'Longitudinal Crack', 'Transverse Crack', 'Alligator Crack'],
    datasets: [
      {
        data: [
          data?.['Pothole'] || 0,
          data?.['Longitudinal Crack'] || 0,
          data?.['Transverse Crack'] || 0,
          data?.['Alligator Crack'] || 0,
        ],
        backgroundColor: [
          '#ef4444', // Red for Potholes
          '#06b6d4', // Cyan for Longitudinal
          '#3b82f6', // Blue for Transverse
          '#f59e0b', // Amber for Alligator
        ],
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
