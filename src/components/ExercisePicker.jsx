import { useMemo, useState } from 'react'
import { fuzzySearchExercises } from '../lib/fuzzySearch'
import AddExerciseModal from './AddExerciseModal'

export default function ExercisePicker({ exercises, exerciseId, exerciseName, onChange, onExerciseCreated }) {
  const [query, setQuery] = useState(exerciseName || '')
  const [open, setOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const matches = useMemo(() => {
    const list = query.trim() ? fuzzySearchExercises(query, exercises) : exercises
    return list.slice(0, 8)
  }, [query, exercises])

  const hasExactMatch = exercises.some((e) => e.name.toLowerCase() === query.trim().toLowerCase())

  function selectExercise(exercise) {
    setQuery(exercise.name)
    setOpen(false)
    onChange({ exerciseId: exercise.id, exerciseName: exercise.name })
  }

  function handleQueryChange(value) {
    setQuery(value)
    setOpen(true)
    onChange({ exerciseId: null, exerciseName: value })
  }

  return (
    <div className="picker">
      <input
        placeholder="Tap to choose an exercise"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => handleQueryChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {exerciseId && <span className="picker-selected-check" aria-hidden="true">✓</span>}

      {open && (
        <div className="picker-dropdown">
          {matches.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="picker-option"
              onMouseDown={(e) => {
                e.preventDefault()
                selectExercise(ex)
              }}
            >
              {ex.name}
            </button>
          ))}
          {matches.length === 0 && (
            <div className="picker-empty">No exercises match "{query}".</div>
          )}
          {query.trim() && !hasExactMatch && (
            <button
              type="button"
              className="picker-option picker-option-add"
              onMouseDown={(e) => {
                e.preventDefault()
                setShowAddModal(true)
              }}
            >
              + Add "{query.trim()}" as new exercise
            </button>
          )}
        </div>
      )}

      {showAddModal && (
        <AddExerciseModal
          initialName={query.trim()}
          onClose={() => setShowAddModal(false)}
          onCreated={(exercise) => {
            setShowAddModal(false)
            onExerciseCreated?.(exercise)
            selectExercise(exercise)
          }}
        />
      )}
    </div>
  )
}
