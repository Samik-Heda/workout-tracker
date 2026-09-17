const TABS = [
  { key: 'sessions', label: 'Sessions', icon: '📋' },
  { key: 'exercises', label: 'Exercises', icon: '💪' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
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
          <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
