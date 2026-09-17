const URL_REGEX = /(https?:\/\/\S+)/g

// Splits text into plain-text and link segments so URLs (e.g. a video link
// pasted into an exercise's notes) can be rendered as clickable anchors.
export function linkifyParts(text) {
  const parts = []
  let lastIndex = 0
  for (const match of text.matchAll(URL_REGEX)) {
    if (match.index > lastIndex) parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    parts.push({ type: 'link', value: match[0] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) })
  return parts
}
