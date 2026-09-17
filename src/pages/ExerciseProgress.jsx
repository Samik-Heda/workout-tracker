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
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { getEntriesForExercise, getExercise } from '../db'
import { formatDate } from '../lib/date'
import { formatDuration } from '../lib/duration'
import LinkifiedText from '../components/LinkifiedText'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ChartDataLabels)

const ACCENT = '#39ff88'
const DIM = '#2fbf55'
const GRID = 'rgba(31, 143, 58, 0.35)'
const TICK = '#1f8f3a'

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

  const isTimed = exercise?.type === 'time'

  const chartData = useMemo(() => {
    if (!entries) return null
    const labels = entries.map((e) => formatDate(e.date))

    if (isTimed) {
      return {
        labels,
        datasets: [
          {
            label: 'Duration',
            data: entries.map((e) => e.durationSec),
            borderColor: ACCENT,
            backgroundColor: ACCENT,
            yAxisID: 'y',
            tension: 0.25,
            pointRadius: 3.5,
            datalabels: {
              color: ACCENT,
              align: 'top',
              font: { family: "'Share Tech Mono', monospace", size: 10 },
              formatter: (value) => formatDuration(value),
            },
          },
        ],
      }
    }

    const datasets = []
    if (mode === 'weight' || mode === 'combined') {
      datasets.push({
        label: 'Weight (kg)',
        data: entries.map((e) => e.weightKg),
        borderColor: ACCENT,
        backgroundColor: ACCENT,
        yAxisID: 'y',
        tension: 0.25,
        pointRadius: 3.5,
        datalabels: {
          color: ACCENT,
          align: 'top',
          font: { family: "'Share Tech Mono', monospace", size: 10 },
          formatter: (value) => `${value}kg`,
        },
      })
    }
    if (mode === 'reps' || mode === 'combined') {
      datasets.push({
        label: 'Reps',
        data: entries.map((e) => e.reps),
        borderColor: DIM,
        backgroundColor: DIM,
        borderDash: mode === 'combined' ? [5, 4] : [],
        yAxisID: mode === 'combined' ? 'y1' : 'y',
        tension: 0.25,
        pointRadius: 3,
        datalabels: {
          color: DIM,
          align: 'bottom',
          font: { family: "'Share Tech Mono', monospace", size: 9 },
          formatter: (value) => `${value}`,
        },
      })
    }
    return { labels, datasets }
  }, [entries, mode, isTimed])

  const chartOptions = useMemo(() => {
    const tickFont = { family: "'Share Tech Mono', monospace", size: 10 }
    const scales = {
      x: { ticks: { color: TICK, font: tickFont }, grid: { color: GRID } },
      y: {
        position: 'left',
        title: {
          display: true,
          text: isTimed ? 'Duration (s)' : mode === 'reps' ? 'Reps' : 'Weight (kg)',
          color: TICK,
          font: tickFont,
        },
        ticks: { color: TICK, font: tickFont },
        grid: { color: GRID },
      },
    }
    if (!isTimed && mode === 'combined') {
      scales.y1 = {
        position: 'right',
        title: { display: true, text: 'Reps', color: TICK, font: tickFont },
        ticks: { color: TICK, font: tickFont },
        grid: { drawOnChartArea: false },
      }
    }
    return {
      responsive: true,
      layout: { padding: { top: 16, bottom: mode === 'combined' ? 16 : 4 } },
      scales,
      plugins: {
        legend: { labels: { color: '#eafff1', font: tickFont } },
        tooltip: {
          backgroundColor: '#0a130b',
          borderColor: ACCENT,
          borderWidth: 1,
          titleColor: '#eafff1',
          bodyColor: ACCENT,
          bodyFont: tickFont,
          titleFont: tickFont,
        },
      },
    }
  }, [mode, isTimed])

  const modeIndex = MODES.findIndex((m) => m.key === mode)

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-text" onClick={onBack}>back</button>
      </div>
      <h1>{exercise?.name ?? '…'}</h1>

      {exercise?.notes && <LinkifiedText className="note" text={exercise.notes} />}

      {!isTimed && (
        <div className="toggle-group" style={{ '--toggle-pos': `${modeIndex * 33.333}%` }}>
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
      )}

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
                <span className="muted">
                  {entry.durationSec != null ? formatDuration(entry.durationSec) : `${entry.weightKg}kg × ${entry.reps}`}
                </span>
              </div>
              {entry.note && <p className="note">{entry.note}</p>}
            </li>
          ))}
      </ul>
    </div>
  )
}
