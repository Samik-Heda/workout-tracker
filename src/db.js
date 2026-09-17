import { openDB } from 'idb'

const DB_NAME = 'workout-tracker'
const DB_VERSION = 2

const SEED_EXERCISES = [
  // Chest
  'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Bench Press',
  'Incline Dumbbell Press', 'Dumbbell Fly', 'Incline Dumbbell Fly', 'Cable Fly',
  'Chest Press Machine', 'Push-up', 'Dip',
  // Back
  'Deadlift', 'Sumo Deadlift', 'Rack Pull', 'Barbell Row', 'Pendlay Row',
  'Dumbbell Row', 'T-Bar Row', 'Seated Cable Row', 'Lat Pulldown',
  'Close-Grip Lat Pulldown', 'Pull-up', 'Chin-up', 'Face Pull', 'Shrug',
  // Legs
  'Squat', 'Front Squat', 'Box Squat', 'Zercher Squat', 'Goblet Squat',
  'Bulgarian Split Squat', 'Leg Press', 'Walking Lunge', 'Leg Extension',
  'Leg Curl', 'Romanian Deadlift', 'Calf Raise', 'Seated Calf Raise',
  'Hip Thrust', 'Glute Bridge',
  // Shoulders
  'Overhead Press', 'Push Press', 'Seated Dumbbell Shoulder Press', 'Arnold Press',
  'Lateral Raise', 'Cable Lateral Raise', 'Front Raise', 'Rear Delt Fly', 'Upright Row',
  // Arms
  'Bicep Curl', 'Barbell Curl', 'Incline Barbell Curl', 'Hammer Curl', 'Preacher Curl',
  'Concentration Curl', 'Cable Curl', 'Spider Curl', 'Tricep Pushdown',
  'Overhead Tricep Extension', 'Skull Crusher', 'Close-Grip Bench Press',
  // Core / other
  'Plank', 'Sit-up', 'Crunch', 'Cable Crunch', 'Hanging Leg Raise', 'Russian Twist',
  'Ab Wheel Rollout', "Farmer's Carry", 'Kettlebell Swing',
]

function uid() {
  return crypto.randomUUID()
}

async function seedMissingExercises(exercisesStore) {
  const existing = await exercisesStore.getAll()
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))
  const now = Date.now()
  for (const name of SEED_EXERCISES) {
    if (!existingNames.has(name.toLowerCase())) {
      await exercisesStore.put({ id: uid(), name, archived: false, createdAt: now })
    }
  }
}

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  async upgrade(db, oldVersion, _newVersion, transaction) {
    let exercisesStore

    if (oldVersion < 1) {
      exercisesStore = db.createObjectStore('exercises', { keyPath: 'id' })
      exercisesStore.createIndex('archived', 'archived')

      const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
      sessions.createIndex('date', 'date')

      const entries = db.createObjectStore('entries', { keyPath: 'id' })
      entries.createIndex('exerciseId', 'exerciseId')
      entries.createIndex('sessionId', 'sessionId')
    } else {
      exercisesStore = transaction.objectStore('exercises')
    }

    if (oldVersion < 2) {
      await seedMissingExercises(exercisesStore)
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
