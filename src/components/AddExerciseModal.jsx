import { useState } from 'react'
import Modal from './Modal'
import { addExercise } from '../db'

export default function AddExerciseModal({ initialName = '', onCreated, onClose }) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a name for the exercise.')
      return
    }
    setSaving(true)
    const exercise = await addExercise(trimmed)
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
