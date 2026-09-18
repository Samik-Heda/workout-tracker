import { useEffect, useMemo, useState } from 'react'
import {
  countEntriesForExercise,
  deleteExercise,
  getExercises,
  setExerciseArchived,
  updateExercise,
} from '../db'
import { fuzzySearchExercises } from '../lib/fuzzySearch'
import AddExerciseModal from '../components/AddExerciseModal'

export default function Exercises({ onSelectExercise }) {
  const [exercises, setExercises] = useState(null)
  const [archived, setArchived] = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [query, setQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingType, setEditingType] = useState('reps')
  const [editingNotes, setEditingNotes] = useState('')

  function refresh() {
    getExercises().then(setExercises)
    getExercises({ includeArchived: true }).then((all) =>
      setArchived(all.filter((e) => e.archived))
    )
  }

  useEffect(refresh, [])

  const visibleExercises = useMemo(() => {
    if (!exercises) return exercises
    return query.trim() ? fuzzySearchExercises(query, exercises) : exercises
  }, [exercises, query])

  const hasExactMatch = (exercises ?? []).some((e) => e.name.toLowerCase() === query.trim().toLowerCase())

  function handleAddClick() {
    if (!query.trim() || hasExactMatch) return
    setShowAddModal(true)
  }

  async function handleEditSave(id) {
    const name = editingName.trim()
    if (name) await updateExercise(id, { name, type: editingType, notes: editingNotes })
    setEditingId(null)
    refresh()
  }

  async function handleArchive(id, archivedValue) {
    await setExerciseArchived(id, archivedValue)
    refresh()
  }

  async function handleDelete(exercise) {
    const entryCount = await countEntriesForExercise(exercise.id)
    const warning = entryCount > 0
      ? ` It has ${entryCount} logged set${entryCount === 1 ? '' : 's'} in your history — those will show as "Unknown exercise" instead of being deleted.`
      : ''
    const confirmed = window.confirm(`Permanently delete "${exercise.name}"?${warning}`)
    if (!confirmed) return
    await deleteExercise(exercise.id)
    refresh()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Exercises</h1>
      </div>

      <div className="field-row">
        <input
          placeholder="Search or add an exercise"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
        />
        <button className="btn-primary" onClick={handleAddClick} disabled={!query.trim() || hasExactMatch}>Add</button>
      </div>

      {showAddModal && (
        <AddExerciseModal
          initialName={query.trim()}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            setQuery('')
            refresh()
          }}
        />
      )}

      {exercises === null && <p className="muted">Loading…</p>}

      {exercises?.length > 0 && visibleExercises?.length === 0 && (
        <p className="muted">No exercises match "{query.trim()}". Tap Add to create it.</p>
      )}

      <ul className="list">
        {visibleExercises?.map((ex) => (
          <li key={ex.id} className={editingId === ex.id ? 'card' : 'card exercise-row'}>
            {editingId === ex.id ? (
              <>
                <label className="field">
                  <span>Name</span>
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                </label>
                <label className="field">
                  <span>Tracked by</span>
                  <select value={editingType} onChange={(e) => setEditingType(e.target.value)}>
                    <option value="reps">Weight &amp; reps</option>
                    <option value="time">Time (e.g. plank)</option>
                  </select>
                </label>
                <label className="field">
                  <span>Notes (optional — video link, cues, etc.)</span>
                  <textarea rows={3} value={editingNotes} onChange={(e) => setEditingNotes(e.target.value)} />
                </label>
                <div className="card-actions">
                  <button className="btn-text" onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="btn-text" onClick={() => handleEditSave(ex.id)}>Save</button>
                </div>
              </>
            ) : (
              <>
                <button className="exercise-name-btn" onClick={() => onSelectExercise(ex.id)}>
                  {ex.name}
                  {ex.type === 'time' && <span className="badge">⏱ timed</span>}
                </button>
                <div className="row-actions">
                  <button
                    className="btn-text"
                    onClick={() => {
                      setEditingId(ex.id)
                      setEditingName(ex.name)
                      setEditingType(ex.type ?? 'reps')
                      setEditingNotes(ex.notes ?? '')
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn-text" onClick={() => handleArchive(ex.id, true)}>Archive</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <button className="btn-text" onClick={() => setShowArchived((v) => !v)}>
        {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
      </button>

      {showArchived && (
        <ul className="list">
          {archived.map((ex) => (
            <li key={ex.id} className="card exercise-row">
              <span className="muted">{ex.name}</span>
              <div className="row-actions">
                <button className="btn-text" onClick={() => handleArchive(ex.id, false)}>Unarchive</button>
                <button className="btn-text btn-danger-text" onClick={() => handleDelete(ex)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
