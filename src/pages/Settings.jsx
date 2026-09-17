import { useRef, useState } from 'react'
import { downloadBackup, restoreBackupFromFile } from '../lib/backup'

export default function Settings() {
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState('')

  async function handleExport() {
    setStatus('')
    await downloadBackup()
    setStatus('Backup downloaded.')
  }

  function handleImportClick() {
    setStatus('')
    fileInputRef.current?.click()
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const confirmed = window.confirm(
      'Importing will replace all current data on this phone with the contents of the backup file. Continue?'
    )
    if (!confirmed) return

    try {
      await restoreBackupFromFile(file)
      setStatus('Backup restored. Reloading…')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setStatus(err.message || 'Could not import that file.')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="card">
        <h2 className="section-title">Backup</h2>
        <p className="muted">
          All your data lives only on this phone. Export a backup file regularly so you never lose your history.
        </p>
        <button className="btn-primary btn-block" onClick={handleExport}>Export backup (JSON)</button>
        <button className="btn-secondary btn-block" onClick={handleImportClick}>Import backup</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={handleFileChosen}
        />
        {status && <p className="note">{status}</p>}
      </div>

      <div className="card">
        <h2 className="section-title">About</h2>
        <p className="muted">Workout Tracker — a personal, offline-first workout log. Your data never leaves this device.</p>
      </div>
    </div>
  )
}
