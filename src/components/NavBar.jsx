const TABS = [
  { key: 'sessions', label: 'sessions' },
  { key: 'exercises', label: 'exercises' },
  { key: 'settings', label: 'settings' },
]

export default function NavBar({ active, onChange }) {
  return (
    <nav className="nav-bar">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`nav-tab ${active === tab.key ? 'nav-tab-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
