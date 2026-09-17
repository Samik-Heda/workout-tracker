function normalize(s) {
  return s.toLowerCase().trim()
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

// Case/typo-tolerant search: substring hits rank highest, then whole-word and
// sliding-window edit-distance matches so a slight misspelling still surfaces.
export function fuzzySearchExercises(query, exercises) {
  const q = normalize(query)
  if (!q) return exercises

  const scored = []
  for (const ex of exercises) {
    const name = normalize(ex.name)
    let score = -1

    if (name.includes(q)) {
      score = 1000 - name.indexOf(q) - (name.length - q.length) * 0.1
    } else {
      const threshold = Math.max(1, Math.ceil(q.length * 0.4))
      const wholeDist = levenshtein(q, name)
      let bestWindowDist = Infinity
      for (let i = 0; i <= Math.max(0, name.length - q.length); i++) {
        const d = levenshtein(q, name.slice(i, i + q.length))
        if (d < bestWindowDist) bestWindowDist = d
      }
      const bestDist = Math.min(wholeDist, bestWindowDist)
      if (bestDist <= threshold) score = 500 - bestDist * 50
    }

    if (score > -1) scored.push({ ex, score })
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.ex)
}
