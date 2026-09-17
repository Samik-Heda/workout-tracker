import { exportAll, importAll } from '../db'

export async function downloadBackup() {
  const data = await exportAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `workout-tracker-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function restoreBackupFromFile(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!Array.isArray(data.exercises) || !Array.isArray(data.sessions) || !Array.isArray(data.entries)) {
    throw new Error('This file does not look like a valid Workout Tracker backup.')
  }
  await importAll(data)
}
