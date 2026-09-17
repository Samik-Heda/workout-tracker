import { useState } from 'react'
import NavBar from './components/NavBar'
import Sessions from './pages/Sessions'
import NewSession from './pages/NewSession'
import Exercises from './pages/Exercises'
import ExerciseProgress from './pages/ExerciseProgress'
import Settings from './pages/Settings'

export default function App() {
  const [tab, setTab] = useState('sessions')
  const [view, setView] = useState({ name: 'sessions' })

  function goToTab(tabKey) {
    setTab(tabKey)
    setView({ name: tabKey })
  }

  let content
  switch (view.name) {
    case 'newSession':
      content = (
        <NewSession
          onSaved={() => setView({ name: 'sessions', refreshKey: Date.now() })}
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
      <main className="app-content">{content}</main>
      <NavBar active={tab} onChange={goToTab} />
    </div>
  )
}
