import { useEffect, useState } from 'react'
import NavBar from './components/NavBar'
import Toast from './components/Toast'
import Sessions from './pages/Sessions'
import NewSession from './pages/NewSession'
import Exercises from './pages/Exercises'
import ExerciseProgress from './pages/ExerciseProgress'
import Settings from './pages/Settings'
import { downloadBackup } from './lib/backup'

export default function App() {
  const [tab, setTab] = useState('sessions')
  const [view, setView] = useState({ name: 'sessions' })
  const [toastMessages, setToastMessages] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('autobackup') !== '1') return

    params.delete('autobackup')
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash
    window.history.replaceState({}, '', cleanUrl)

    downloadBackup().then(() => setToastMessages(['Backup downloaded automatically']))
  }, [])

  function goToTab(tabKey) {
    setTab(tabKey)
    setView({ name: tabKey })
  }

  function handleSessionSaved(achievements) {
    setView({ name: 'sessions', refreshKey: Date.now() })
    if (achievements?.length) setToastMessages(achievements)
  }

  let content
  switch (view.name) {
    case 'newSession':
      content = (
        <NewSession
          onSaved={handleSessionSaved}
          onCancel={() => setView({ name: 'sessions' })}
        />
      )
      break
    case 'progress':
      content = (
        <ExerciseProgress exerciseId={view.exerciseId} onBack={() => setView({ name: 'exercises' })} />
      )
      break
    case 'exercises':
      content = <Exercises onSelectExercise={(exerciseId) => setView({ name: 'progress', exerciseId })} />
      break
    case 'settings':
      content = <Settings />
      break
    default:
      content = (
        <Sessions
          key={view.refreshKey}
          onNewSession={() => setView({ name: 'newSession' })}
        />
      )
  }

  return (
    <div className="app">
      <div className="scanlines" aria-hidden="true" />
      <div className="grid-floor" aria-hidden="true" />
      <Toast messages={toastMessages} onDismiss={() => setToastMessages(null)} />
      <main className="app-content">{content}</main>
      <NavBar active={tab} onChange={goToTab} />
    </div>
  )
}
