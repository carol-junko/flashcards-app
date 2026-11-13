import { deckDataPath } from './deckPaths.js'

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

// Hand-written exercises for a deck (exercises.json), or [] if it has none.
export async function loadExercises(langId, deckId) {
  const data = await fetchJsonIfExists(`${deckDataPath(langId, deckId)}/exercises.json`)
  if (!data) return []
  return Array.isArray(data) ? data : data.exercises || []
}
