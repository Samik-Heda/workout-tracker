import { useEffect, useState } from 'react'
import { addSession, getEntriesForExercise, getExercises } from '../db'
import { today } from '../lib/date'
import { formatDuration } from '../lib/duration'
import { evaluateProgress } from '../lib/progress'
import ExercisePicker from '../components/ExercisePicker'

function emptyRow() {
  return {
    key: crypto.randomUUID(),
    exerciseId: null,
    exerciseName: '',
    weightKg: '',
    reps: '',
    durationSec: '',
    note: '',
  }
}

export default function NewSession({ onSaved, onCancel }) {
  const [exercises, setExercises] = useState([])
  const [date, setDate] = useState(today())
  const [sessionNote, setSessionNote] = useState('')
  const [rows, setRows] = useState([emptyRow()])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getExercises().then(setExercises)
  }, [])

  function updateRow(key, patch) {
    setRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((rows) => [...rows, emptyRow()])
  }

  function removeRow(key) {
    setRows((rows) => rows.filter((row) => row.key !== key))
  }

  function handleExerciseCreated(exercise) {
    setExercises((list) => [...list, exercise].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function isTimedRow(row) {
    return exercises.find((e) => e.id === row.exerciseId)?.type === 'time'
  }

  async function handleSave() {
    setError('')
    const touchedRows = rows.filter((row) => row.exerciseName.trim() || row.exerciseId)

    if (touchedRows.length === 0) {
      setError('Add at least one exercise.')
      return
    }
    for (const row of touchedRows) {
      if (!row.exerciseId) {
        setError(`Select "${row.exerciseName.trim()}" from the list, or add it as a new exercise, before saving.`)
        return
      }
      if (isTimedRow(row)) {
        if (row.durationSec === '') {
          setError(`Enter a duration for ${row.exerciseName.trim()}.`)
          return
        }
      } else if (row.weightKg === '' || row.reps === '') {
        setError(`Enter weight and reps for ${row.exerciseName.trim()}.`)
        return
      }
    }

    setSaving(true)
    try {
      const entries = touchedRows.map((row) =>
        isTimedRow(row)
          ? { exerciseId: row.exerciseId, durationSec: Number(row.durationSec), note: row.note }
          : { exerciseId: row.exerciseId, weightKg: Number(row.weightKg), reps: Number(row.reps), note: row.note }
      )

      const priorHistory = {}
      for (const entry of entries) {
        if (!(entry.exerciseId in priorHistory)) {
          priorHistory[entry.exerciseId] = await getEntriesForExercise(entry.exerciseId)
        }
      }

      const achievements = []
      for (const row of touchedRows) {
        const timed = isTimedRow(row)
        const newEntry = timed
          ? { durationSec: Number(row.durationSec) }
          : { weightKg: Number(row.weightKg), reps: Number(row.reps) }
        const { isPR, isBeatLast } = evaluateProgress(newEntry, priorHistory[row.exerciseId])
        const label = timed ? formatDuration(Number(row.durationSec)) : `${row.weightKg}kg × ${row.reps}`
        if (isPR) {
          achievements.push(`New PR on ${row.exerciseName.trim()} — ${label}`)
        } else if (isBeatLast) {
          achievements.push(`Beat your last ${row.exerciseName.trim()} session — ${label}`)
        }
      }

      await addSession({ date, note: sessionNote, entries })
      onSaved(achievements)
    } catch {
      setError('Something went wrong saving this session. Try again.')
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>New Session</h1>
        <button className="btn-text" onClick={onCancel}>Cancel</button>
      </div>

      <label className="field">
        <span>Date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      {rows.map((row, i) => (
        <div key={row.key} className="card entry-form-row">
          <div className="card-title-row">
            <strong>Exercise {i + 1}</strong>
            {rows.length > 1 && (
              <button className="btn-text" onClick={() => removeRow(row.key)}>Remove</button>
            )}
          </div>
          <label className="field">
            <span>Exercise</span>
            <ExercisePicker
              exercises={exercises}
              exerciseId={row.exerciseId}
              exerciseName={row.exerciseName}
              onChange={({ exerciseId, exerciseName }) => updateRow(row.key, { exerciseId, exerciseName })}
              onExerciseCreated={handleExerciseCreated}
            />
          </label>
          {isTimedRow(row) ? (
            <label className="field">
              <span>Duration (seconds)</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={row.durationSec}
                onChange={(e) => updateRow(row.key, { durationSec: e.target.value })}
              />
            </label>
          ) : (
            <div className="field-row">
              <label className="field">
                <span>Weight (kg)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={row.weightKg}
                  onChange={(e) => updateRow(row.key, { weightKg: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Reps</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={row.reps}
                  onChange={(e) => updateRow(row.key, { reps: e.target.value })}
                />
              </label>
            </div>
          )}
          <label className="field">
            <span>Note (optional)</span>
            <input
              placeholder="e.g. felt easy, last rep was a grind"
              value={row.note}
              onChange={(e) => updateRow(row.key, { note: e.target.value })}
            />
          </label>
        </div>
      ))}

      <button className="btn-secondary" onClick={addRow}>+ Add another exercise</button>

      <label className="field">
        <span>Session note (optional)</span>
        <input
          placeholder="e.g. morning gym session"
          value={sessionNote}
          onChange={(e) => setSessionNote(e.target.value)}
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button className="btn-primary btn-block" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Session'}
      </button>
    </div>
  )
}
