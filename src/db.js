import { openDB } from 'idb'

const DB_NAME = 'workout-tracker'
const DB_VERSION = 1

const SEED_EXERCISES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Pull-up',
  'Dip',
  'Bicep Curl',
  'Lat Pulldown',
  'Leg Press',
]

function uid() {
  return crypto.randomUUID()
}

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const exercises = db.createObjectStore('exercises', { keyPath: 'id' })
    exercises.createIndex('archived', 'archived')

    const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
    sessions.createIndex('date', 'date')

    const entries = db.createObjectStore('entries', { keyPath: 'id' })
    entries.createIndex('exerciseId', 'exerciseId')
    entries.createIndex('sessionId', 'sessionId')

    const now = Date.now()
    for (const name of SEED_EXERCISES) {
      exercises.put({ id: uid(), name, archived: false, createdAt: now })
    }
  },
})

// ---- Exercises ----

export async function getExercises({ includeArchived = false } = {}) {
  const db = await dbPromise
  const all = await db.getAll('exercises')
  const filtered = includeArchived ? all : all.filter((e) => !e.archived)
  return filtered.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getExercise(id) {
  const db = await dbPromise
  return db.get('exercises', id)
}

export async function addExercise(name) {
  const db = await dbPromise
  const exercise = { id: uid(), name: name.trim(), archived: false, createdAt: Date.now() }
  await db.put('exercises', exercise)
  return exercise
}

export async function renameExercise(id, name) {
  const db = await dbPromise
  const exercise = await db.get('exercises', id)
  if (!exercise) return
  exercise.name = name.trim()
  await db.put('exercises', exercise)
}

export async function setExerciseArchived(id, archived) {
  const db = await dbPromise
  const exercise = await db.get('exercises', id)
  if (!exercise) return
  exercise.archived = archived
  await db.put('exercises', exercise)
}

// ---- Sessions + Entries ----

export async function getSessions() {
  const db = await dbPromise
  const sessions = await db.getAll('sessions')
  const entries = await db.getAll('entries')
  const exercises = await db.getAll('exercises')
  const exerciseById = Object.fromEntries(exercises.map((e) => [e.id, e]))

  return sessions
    .map((session) => ({
      ...session,
      entries: entries
        .filter((entry) => entry.sessionId === session.id)
        .map((entry) => ({ ...entry, exerciseName: exerciseById[entry.exerciseId]?.name ?? 'Unknown exercise' })),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
}

export async function addSession({ date, note, entries }) {
  const db = await dbPromise
  const tx = db.transaction(['sessions', 'entries'], 'readwrite')
  const session = { id: uid(), date, note: note?.trim() || undefined, createdAt: Date.now() }
  await tx.objectStore('sessions').put(session)

  for (const entry of entries) {
    await tx.objectStore('entries').put({
      id: uid(),
      sessionId: session.id,
      exerciseId: entry.exerciseId,
      weightKg: entry.weightKg,
      reps: entry.reps,
      note: entry.note?.trim() || undefined,
      createdAt: Date.now(),
    })
  }

  await tx.done
  return session
}

export async function getEntriesForExercise(exerciseId) {
  const db = await dbPromise
  const entries = await db.getAllFromIndex('entries', 'exerciseId', exerciseId)
  const sessions = await db.getAll('sessions')
  const sessionById = Object.fromEntries(sessions.map((s) => [s.id, s]))

  return entries
    .map((entry) => ({ ...entry, date: sessionById[entry.sessionId]?.date }))
    .filter((entry) => entry.date)
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ---- Backup ----

export async function exportAll() {
  const db = await dbPromise
  const [exercises, sessions, entries] = await Promise.all([
    db.getAll('exercises'),
    db.getAll('sessions'),
    db.getAll('entries'),
  ])
  return { version: DB_VERSION, exportedAt: new Date().toISOString(), exercises, sessions, entries }
}

export async function importAll(data) {
  const db = await dbPromise
  const tx = db.transaction(['exercises', 'sessions', 'entries'], 'readwrite')
  await Promise.all([
    tx.objectStore('exercises').clear(),
    tx.objectStore('sessions').clear(),
    tx.objectStore('entries').clear(),
  ])
  for (const exercise of data.exercises ?? []) await tx.objectStore('exercises').put(exercise)
  for (const session of data.sessions ?? []) await tx.objectStore('sessions').put(session)
  for (const entry of data.entries ?? []) await tx.objectStore('entries').put(entry)
  await tx.done
}
