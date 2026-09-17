import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { getEntriesForExercise, getExercise } from '../db'
import { formatDate } from '../lib/date'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const MODES = [
  { key: 'combined', label: 'Combined' },
  { key: 'weight', label: 'Weight' },
  { key: 'reps', label: 'Reps' },
]

export default function ExerciseProgress({ exerciseId, onBack }) {
  const [exercise, setExercise] = useState(null)
  const [entries, setEntries] = useState(null)
  const [mode, setMode] = useState('combined')

  useEffect(() => {
    getExercise(exerciseId).then(setExercise)
    getEntriesForExercise(exerciseId).then(setEntries)
  }, [exerciseId])

  const chartData = useMemo(() => {
    if (!entries) return null
    const labels = entries.map((e) => formatDate(e.date))
    const datasets = []
    if (mode === 'weight' || mode === 'combined') {
      datasets.push({
        label: 'Weight (kg)',
        data: entries.map((e) => e.weightKg),
        borderColor: '#22c55e',
        backgroundColor: '#22c55e',
        yAxisID: 'y',
        tension: 0.25,
      })
    }
    if (mode === 'reps' || mode === 'combined') {
      datasets.push({
        label: 'Reps',
        data: entries.map((e) => e.reps),
        borderColor: '#38bdf8',
        backgroundColor: '#38bdf8',
        yAxisID: mode === 'combined' ? 'y1' : 'y',
        tension: 0.25,
      })
    }
    return { labels, datasets }
  }, [entries, mode])

  const chartOptions = useMemo(() => {
    const scales = {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
      y: {
        position: 'left',
        title: { display: true, text: mode === 'reps' ? 'Reps' : 'Weight (kg)', color: '#94a3b8' },
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
      },
    }
    if (mode === 'combined') {
      scales.y1 = {
        position: 'right',
        title: { display: true, text: 'Reps', color: '#94a3b8' },
        ticks: { color: '#94a3b8' },
        grid: { drawOnChartArea: false },
      }
    }
    return {
      responsive: true,
      scales,
      plugins: {
        legend: { labels: { color: '#e2e8f0' } },
      },
    }
  }, [mode])

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-text" onClick={onBack}>← Back</button>
      </div>
      <h1>{exercise?.name ?? '…'}</h1>

      <div className="toggle-group">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`toggle-btn ${mode === m.key ? 'toggle-btn-active' : ''}`}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {entries?.length === 0 && <p className="muted">No logged sets for this exercise yet.</p>}

      {chartData && entries.length > 0 && (
        <div className="chart-wrap">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      <ul className="list">
        {entries
          ?.slice()
          .reverse()
          .map((entry) => (
            <li key={entry.id} className="card">
              <div className="card-title-row">
                <strong>{formatDate(entry.date)}</strong>
                <span className="muted">{entry.weightKg}kg × {entry.reps}</span>
              </div>
              {entry.note && <p className="note">{entry.note}</p>}
            </li>
          ))}
      </ul>
    </div>
  )
}
