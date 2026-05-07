'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip, Legend,
  type ChartOptions,
} from 'chart.js'
import type { TicketTrendApiResponse } from '@/lib/types'
import { B } from './theme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function TrendChart({ data, textColor, gridColor }: {
  data: TicketTrendApiResponse
  textColor: string
  gridColor: string
}) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Previous period',
        data: data.previous,
        backgroundColor: B.cyan + '66',
        borderRadius: 3,
        barPercentage: 0.4,
      },
      {
        label: 'This period',
        data: data.current,
        backgroundColor: B.navy,
        borderRadius: 3,
        barPercentage: 0.4,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: textColor, font: { size: 11 }, boxWidth: 12, padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} tickets`,
        },
      },
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, beginAtZero: true },
    },
  }

  return (
    <div style={{ height: '180px' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
