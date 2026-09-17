import { useEffect, useState } from 'react'
import { addExercise, getExercises, renameExercise, setExerciseArchived } from '../db'

export default function Exercises({ onSelectExercise }) {
  const [exercises, setExercises] = useState(null)
  const [archived, setArchived] = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  function refresh() {
    getExercises().then(setExercises)
    getExercises({ includeArchived: true }).then((all) =>
      setArchived(all.filter((e) => e.archived))
    )
  }

  useEffect(refresh, [])

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    await addExercise(name)
    setNewName('')
    refresh()
  }

  async function handleRenameSave(id) {
    const name = editingName.trim()
    if (name) await renameExercise(id, name)
    setEditingId(null)
    refresh()
  }

  async function handleArchive(id, archivedValue) {
    await setExerciseArchived(id, archivedValue)
    refresh()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Exercises</h1>
      </div>

      <div className="field-row">
        <input
          placeholder="New exercise name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn-primary" onClick={handleAdd}>Add</button>
      </div>

      {exercises === null && <p className="muted">Loading…</p>}

      <ul className="list">
        {exercises?.map((ex) => (
          <li key={ex.id} className="card exercise-row">
            {editingId === ex.id ? (
              <div className="field-row">
                <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                <button className="btn-text" onClick={() => handleRenameSave(ex.id)}>Save</button>
              </div>
            ) : (
              <>
                <button className="exercise-name-btn" onClick={() => onSelectExercise(ex.id)}>
                  {ex.name}
                </button>
                <div className="row-actions">
                  <button
                    className="btn-text"
                    onClick={() => {
                      setEditingId(ex.id)
                      setEditingName(ex.name)
                    }}
                  >
                    Rename
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
              <button className="btn-text" onClick={() => handleArchive(ex.id, false)}>Unarchive</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
