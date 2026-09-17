import { useEffect } from 'react'

export default function Toast({ messages, onDismiss }) {
  useEffect(() => {
    if (!messages || messages.length === 0) return undefined
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [messages, onDismiss])

  if (!messages || messages.length === 0) return null

  return (
    <div className="toast" onClick={onDismiss}>
      {messages.map((message, i) => (
        <div key={i} className="toast-line">{message}</div>
      ))}
    </div>
  )
}
