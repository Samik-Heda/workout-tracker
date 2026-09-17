import { useState } from 'react'
import Modal from './Modal'
import { addExercise } from '../db'

export default function AddExerciseModal({ initialName = '', onCreated, onClose }) {
  const [name, setName] = useState(initialName)
  const [type, setType] = useState('reps')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a name for the exercise.')
      return
    }
    setSaving(true)
    const exercise = await addExercise(trimmed, { type, notes })
    setSaving(false)
    onCreated(exercise)
  }

  return (
    <Modal title="Add new exercise" onClose={onClose}>
      <label className="field">
        <span>Exercise name</span>
        <input
          autoFocus
          placeholder="e.g. Incline Dumbbell Press"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </label>
      <label className="field">
        <span>Tracked by</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="reps">Weight &amp; reps</option>
          <option value="time">Time (e.g. plank)</option>
        </select>
      </label>
      <label className="field">
        <span>Notes (optional — video link, cues, etc.)</span>
        <textarea
          rows={3}
          placeholder="e.g. https://youtu.be/..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Adding…' : 'Add exercise'}
        </button>
      </div>
    </Modal>
  )
}
