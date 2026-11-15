// Spaced repetition: decides WHEN each card should be seen again.
//
// The scheduling math comes from FSRS (ts-fsrs). This module adds:
//   - saving each card's memory state in the browser (localStorage)
//   - building a study queue: cards that are due, then a few new cards
//   - per-deck stats (due / new / mastered)
// It has no Vue code, so it can be unit-tested with `node --test`.
import { fsrs, createEmptyCard, generatorParameters, Rating, State } from 'ts-fsrs'

export { Rating, State }

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))

export const STORAGE_KEY = 'flashcards:progress:v1'
export const NEW_CARDS_PER_DAY = 20
// A card counts as "mastered" once FSRS expects it to be remembered
// for 3+ weeks (stability = days until recall probability drops to 90%).
export const MASTERED_STABILITY_DAYS = 21

export const RATINGS = [
  { value: Rating.Again, label: 'Again', key: '1' },
  { value: Rating.Hard, label: 'Hard', key: '2' },
  { value: Rating.Good, label: 'Good', key: '3' },
  { value: Rating.Easy, label: 'Easy', key: '4' },
]

// ---------------------------------------------------------------- storage

// localStorage can be missing (tests) or throw (private mode, full quota).
// Fall back to an in-memory object so the app still works for the session.
function defaultStorage() {
  try {
    const probe = '__flashcards_probe__'
    globalThis.localStorage.setItem(probe, '1')
    globalThis.localStorage.removeItem(probe)
    return globalThis.localStorage
  } catch {
    const memory = new Map()
    return {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k),
    }
  }
}

function reviveCard(raw) {
  return {
    ...raw,
    due: new Date(raw.due),
    last_review: raw.last_review ? new Date(raw.last_review) : undefined,
  }
}

export function dayKey(date) {
  // Local calendar day, e.g. "2026-11-13": "new cards per day" resets at local midnight
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Shape stored under STORAGE_KEY:
// { "br/br-a1-deck1": { "br-001": { ...fsrsCard, introduced: "2026-11-13" } } }
export function createProgressStore(storage = defaultStorage()) {
  let cache = null

  function readAll() {
    if (cache) return cache
    try {
      cache = JSON.parse(storage.getItem(STORAGE_KEY) || '{}') || {}
    } catch {
      cache = {} // corrupted data: start fresh rather than crash
    }
    return cache
  }

  function writeAll() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(readAll()))
    } catch {
      // Storage full or blocked: progress stays in memory for this session
    }
  }

  return {
    getDeck(deckKey) {
      const raw = readAll()[deckKey] || {}
      return Object.fromEntries(Object.entries(raw).map(([id, c]) => [id, reviveCard(c)]))
    },

    saveCard(deckKey, cardId, card) {
      const all = readAll()
      all[deckKey] = all[deckKey] || {}
      all[deckKey][cardId] = card
      writeAll()
    },

    deckKeys() {
      return Object.keys(readAll())
    },

    reset() {
      cache = {}
      writeAll()
    },
  }
}

// ------------------------------------------------------------- scheduling

// Apply a rating to a card (null = never seen) and return its new state.
export function reviewCard(card, rating, now = new Date()) {
  const isNew = !card
  const current = card || createEmptyCard(now)
  const { card: next } = scheduler.next(current, now, rating)
  return { ...next, introduced: isNew ? dayKey(now) : current.introduced }
}

// What each button would do, e.g. { 1: "1m", 2: "6m", 3: "10m", 4: "8d" }
export function previewIntervals(card, now = new Date()) {
  const options = scheduler.repeat(card || createEmptyCard(now), now)
  return Object.fromEntries(
    RATINGS.map(({ value }) => [value, formatInterval(options[value].card.due - now)])
  )
}

export function formatInterval(ms) {
  const minutes = Math.max(1, Math.round(ms / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 31) return `${days}d`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo`
  return `${(days / 365).toFixed(1)}y`
}

export function isMastered(card) {
  return !!card && card.state === State.Review && card.stability >= MASTERED_STABILITY_DAYS
}

// Study queue for one session: due cards (most overdue first), then new cards
// until today's new-card allowance is used up.
export function buildQueue(cards, progress, now = new Date(), newPerDay = NEW_CARDS_PER_DAY) {
  const today = dayKey(now)
  const introducedToday = Object.values(progress).filter((c) => c.introduced === today).length
  const newAllowance = Math.max(0, newPerDay - introducedToday)

  const due = cards
    .filter((c) => progress[c.id] && progress[c.id].due <= now)
    .sort((a, b) => progress[a.id].due - progress[b.id].due)
  const fresh = cards.filter((c) => !progress[c.id]).slice(0, newAllowance)

  return [...due, ...fresh]
}

export function deckStats(progress, totalCards, now = new Date(), newPerDay = NEW_CARDS_PER_DAY) {
  const states = Object.values(progress)
  const today = dayKey(now)
  const unseen = Math.max(0, totalCards - states.length)
  const introducedToday = states.filter((c) => c.introduced === today).length
  const upcoming = states.filter((c) => c.due > now).map((c) => c.due)
  return {
    due: states.filter((c) => c.due <= now).length,
    newToday: Math.min(unseen, Math.max(0, newPerDay - introducedToday)),
    unseen,
    seen: states.length,
    mastered: states.filter(isMastered).length,
    nextDue: upcoming.length ? new Date(Math.min(...upcoming)) : null,
  }
}
