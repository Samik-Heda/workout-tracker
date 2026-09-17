import { linkifyParts } from '../lib/linkify'

export default function LinkifiedText({ text, className }) {
  const parts = linkifyParts(text)
  return (
    <p className={className}>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a key={i} href={part.value} target="_blank" rel="noopener noreferrer">
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  )
}
