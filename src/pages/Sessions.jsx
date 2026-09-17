import { useEffect, useState } from 'react'
import { getSessions } from '../db'
import { formatDate } from '../lib/date'

export default function Sessions({ onNewSession }) {
  const [sessions, setSessions] = useState(null)

  useEffect(() => {
    getSessions().then(setSessions)
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Sessions</h1>
        <button className="btn-primary" onClick={onNewSession}>+ New Session</button>
      </div>

      {sessions === null && <p className="muted">Loading…</p>}

      {sessions?.length === 0 && (
        <p className="muted">No workouts logged yet. Tap "New Session" to add your first one.</p>
      )}

      <ul className="list">
        {sessions?.map((session) => (
          <li key={session.id} className="card">
            <div className="card-title-row">
              <strong>{formatDate(session.date)}</strong>
              <span className="muted">{session.entries.length} exercise{session.entries.length === 1 ? '' : 's'}</span>
            </div>
            <div className="entry-list">
              {session.entries.map((entry) => (
                <div key={entry.id} className="entry-row">
                  <span>{entry.exerciseName}</span>
                  <span className="muted">{entry.weightKg}kg × {entry.reps}</span>
                </div>
              ))}
            </div>
            {session.note && <p className="note">{session.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
