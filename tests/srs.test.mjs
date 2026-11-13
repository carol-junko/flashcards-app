import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  Rating, State, createProgressStore, reviewCard, buildQueue, deckStats,
  isMastered, formatInterval, previewIntervals, dayKey, STORAGE_KEY,
} from '../src/utils/srs.js'

const NOW = new Date('2026-11-13T10:00:00')
const minutes = (n) => new Date(NOW.getTime() + n * 60000)
const cards = Array.from({ length: 30 }, (_, i) => ({ id: `c${i}` }))

function memoryStorage() {
  const data = new Map()
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k), data }
}

test('a new card rated Good comes back within the same day', () => {
  const card = reviewCard(null, Rating.Good, NOW)
  assert.equal(card.introduced, dayKey(NOW))
  assert.ok(card.due > NOW)
  assert.ok(card.due - NOW < 24 * 3600 * 1000)
})

test('Easy schedules further out than Again', () => {
  const again = reviewCard(null, Rating.Again, NOW)
  const easy = reviewCard(null, Rating.Easy, NOW)
  assert.ok(easy.due > again.due)
})

test('previewIntervals gives one label per button', () => {
  const p = previewIntervals(null, NOW)
  assert.deepEqual(Object.keys(p).map(Number), [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy])
  for (const label of Object.values(p)) assert.match(label, /^\d+(\.\d)?(m|h|d|mo|y)$/)
})

test('buildQueue: due cards first (most overdue first), then new cards up to the daily limit', () => {
  const progress = {
    c5: { ...reviewCard(null, Rating.Good, minutes(-600)), due: minutes(-5), introduced: '2026-11-01' },
    c7: { ...reviewCard(null, Rating.Good, minutes(-600)), due: minutes(-60), introduced: '2026-11-01' },
    c9: { ...reviewCard(null, Rating.Good, minutes(-600)), due: minutes(+60), introduced: '2026-11-01' },
  }
  const queue = buildQueue(cards, progress, NOW, 4)
  assert.deepEqual(queue.map((c) => c.id), ['c7', 'c5', 'c0', 'c1', 'c2', 'c3'])
})

test('new cards introduced today count against the daily limit', () => {
  const progress = {}
  for (let i = 0; i < 18; i++) progress[`c${i}`] = { ...reviewCard(null, Rating.Good, NOW), due: minutes(30) }
  const queue = buildQueue(cards, progress, NOW, 20)
  assert.equal(queue.length, 2) // only 2 of today's 20 new cards left
})

test('deckStats counts due, new, unseen and mastered cards', () => {
  const mastered = { ...reviewCard(null, Rating.Easy, NOW), state: State.Review, stability: 40, due: minutes(60 * 24 * 30) }
  const progress = { c0: mastered, c1: { ...reviewCard(null, Rating.Again, NOW), due: minutes(-1) } }
  const stats = deckStats(progress, 30, NOW, 20)
  assert.equal(stats.due, 1)
  assert.equal(stats.unseen, 28)
  assert.equal(stats.seen, 2)
  assert.equal(stats.mastered, 1)
  assert.ok(isMastered(mastered))
  assert.ok(stats.nextDue instanceof Date)
})

test('progress store saves to storage and revives dates', () => {
  const storage = memoryStorage()
  const store = createProgressStore(storage)
  store.saveCard('br/br-a1-deck1', 'br-001', reviewCard(null, Rating.Good, NOW))
  assert.ok(storage.data.get(STORAGE_KEY).includes('br-001'))

  const reloaded = createProgressStore(storage).getDeck('br/br-a1-deck1')
  assert.ok(reloaded['br-001'].due instanceof Date)
})

test('progress store survives corrupted storage', () => {
  const storage = memoryStorage()
  storage.setItem(STORAGE_KEY, '{not json')
  assert.deepEqual(createProgressStore(storage).getDeck('x'), {})
})

test('formatInterval', () => {
  assert.equal(formatInterval(30 * 1000), '1m')
  assert.equal(formatInterval(10 * 60000), '10m')
  assert.equal(formatInterval(3 * 3600000), '3h')
  assert.equal(formatInterval(8 * 86400000), '8d')
  assert.equal(formatInterval(90 * 86400000), '3mo')
})
