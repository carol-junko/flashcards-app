import { deckDataPath } from './deckPaths.js'
import { generateExercises } from './exerciseGenerator.js'

// Fetch a JSON file, returning null when it doesn't exist.
// Careful: single-page-app hosts (Vite preview, Netlify...) answer a missing
// file with index.html and status 200, so we also check the content type.
export async function fetchJsonIfExists(url) {
  const response = await fetch(url)
  const type = response.headers.get('content-type') || ''
  if (response.status === 404 || !type.includes('json')) return null
  if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`)
  return response.json()
}

// A deck's exercises: the hand-written exercises.json when the deck has one,
// otherwise a fresh set generated from the deck's own flashcards.
export async function loadExercises(langId, deckId) {
  const folder = deckDataPath(langId, deckId)
  // Offline, a deck without exercises.json fails to fetch (nothing was cached):
  // treat that as "no hand-written exercises" and generate them from the cards.
  const data = await fetchJsonIfExists(`${folder}/exercises.json`).catch(() => null)
  const handWritten = data ? (Array.isArray(data) ? data : data.exercises || []) : []
  if (handWritten.length) return handWritten

  const cards = await fetchJsonIfExists(`${folder}/flashcards.json`)
  return Array.isArray(cards) ? generateExercises(cards) : []
}
