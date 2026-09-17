// Compares a newly logged set against an exercise's prior history (sorted
// ascending by date, not including the new entry) to detect a PR or an
// improvement over the last time it was logged.
export function evaluateProgress(newEntry, priorEntries) {
  if (!priorEntries || priorEntries.length === 0) {
    return { isPR: false, isBeatLast: false }
  }

  if (newEntry.durationSec != null) {
    const last = priorEntries[priorEntries.length - 1]
    const isBeatLast = newEntry.durationSec > last.durationSec
    const maxDuration = Math.max(...priorEntries.map((e) => e.durationSec))
    const isPR = newEntry.durationSec > maxDuration
    return { isPR, isBeatLast }
  }

  const last = priorEntries[priorEntries.length - 1]
  const isBeatLast =
    newEntry.weightKg > last.weightKg || (newEntry.weightKg === last.weightKg && newEntry.reps > last.reps)

  let maxWeight = -Infinity
  let repsAtMaxWeight = 0
  for (const entry of priorEntries) {
    if (entry.weightKg > maxWeight) {
      maxWeight = entry.weightKg
      repsAtMaxWeight = entry.reps
    } else if (entry.weightKg === maxWeight && entry.reps > repsAtMaxWeight) {
      repsAtMaxWeight = entry.reps
    }
  }
  const isPR =
    newEntry.weightKg > maxWeight || (newEntry.weightKg === maxWeight && newEntry.reps > repsAtMaxWeight)

  return { isPR, isBeatLast }
}
