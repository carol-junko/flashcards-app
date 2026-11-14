import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildPlan, placementLevel, reachableLevel, hoursBetween, scheduleDecks, currentWeek, cefrOfDeck,
} from '../src/utils/studyPlan.js'

const decks = JSON.parse(readFileSync('public/data/manifests/br-manifest.json', 'utf8'))

test('A1 → C1 in 3 months at 1h/day is flagged as unrealistic, with honest alternatives', () => {
  const plan = buildPlan({ currentLevel: 'A1', targetLevel: 'C1', weeks: 12, minutesPerDay: 60, daysPerWeek: 7, decks })
  assert.equal(plan.feasible, false)
  assert.equal(plan.hoursNeeded, 655)
  assert.equal(plan.hoursAvailable, 84)
  // 84 hours isn't a full level (A1 → A2 takes 95), so the plan heads to A2 and says how far it gets
  assert.equal(plan.planLevel, 'A2')
  assert.equal(plan.partialPercent, 88)
  assert.ok(plan.minutesPerDayNeeded > 400)
  assert.ok(plan.weeksNeeded > 90)
})

test('mode "target" keeps the goal and stretches the timeline instead', () => {
  const plan = buildPlan({ currentLevel: 'A1', targetLevel: 'B1', weeks: 12, minutesPerDay: 60, decks, mode: 'target' })
  assert.equal(plan.planLevel, 'B1')
  assert.equal(plan.planWeeks, plan.weeksNeeded)
  assert.deepEqual(plan.levelsToStudy, ['A2', 'B1'])
})

test('a feasible plan schedules every deck of the levels to study, in order', () => {
  const plan = buildPlan({ currentLevel: 'A0', targetLevel: 'A2', weeks: 32, minutesPerDay: 60, daysPerWeek: 6, decks })
  assert.equal(plan.feasible, true)
  const scheduled = plan.schedule.flatMap((w) => w.decks.map((d) => d.id))
  const expected = decks.filter((d) => ['A1', 'A2'].includes(cefrOfDeck(d.id))).map((d) => d.id)
  assert.deepEqual(scheduled, expected)
  assert.equal(plan.schedule.length, 32)
  assert.equal(plan.partialPercent, null)
})

test('levels without published content are reported', () => {
  // Fixture: the C1 decks are still locked
  const lockedC1 = [
    { id: 'br-b2-deck1', cardCount: 40 },
    { id: 'br-c1-deck2', cardCount: 40, comingSoon: true },
  ]
  const plan = buildPlan({ currentLevel: 'B2', targetLevel: 'C1', weeks: 52, minutesPerDay: 60, decks: lockedC1 })
  assert.deepEqual(plan.missingLevels, ['C1'])
})

test('target must be above current level', () => {
  assert.throws(() => buildPlan({ currentLevel: 'B1', targetLevel: 'A2', weeks: 4, minutesPerDay: 30, decks }))
})

test('daily minutes follow the goal split', () => {
  const plan = buildPlan({ currentLevel: 'A0', targetLevel: 'A1', weeks: 10, minutesPerDay: 60, goal: 'conversation', decks })
  assert.equal(plan.dailyMinutes.speaking, 15)
  assert.equal(Object.values(plan.dailyMinutes).reduce((a, b) => a + b, 0), 60)
})

test('placementLevel = highest level passed in a row', () => {
  assert.equal(placementLevel({}), 'A0')
  assert.equal(placementLevel({ A1: { correct: 5, total: 5 }, A2: { correct: 2, total: 5 } }), 'A1')
  assert.equal(placementLevel({ A1: { correct: 4, total: 5 }, A2: { correct: 4, total: 5 }, B1: { correct: 5, total: 5 } }), 'B1')
  assert.equal(placementLevel({ A1: { correct: 3, total: 5 }, A2: { correct: 5, total: 5 } }), 'A0')
})

test('hours and reachable level', () => {
  assert.equal(hoursBetween('A0', 'B1'), 375)
  assert.equal(reachableLevel('A0', 200), 'A2')
  assert.equal(reachableLevel('B2', 10), 'B2')
})

test('scheduleDecks balances cards across weeks', () => {
  const ten = Array.from({ length: 10 }, (_, i) => ({ id: `d${i}`, cardCount: 30 }))
  const weeks = scheduleDecks(ten, 5)
  assert.deepEqual(weeks.map((w) => w.cards), [60, 60, 60, 60, 60])
})

test('currentWeek', () => {
  assert.equal(currentWeek('2026-11-01T00:00:00Z', '2026-11-03T00:00:00Z'), 1)
  assert.equal(currentWeek('2026-11-01T00:00:00Z', '2026-11-15T12:00:00Z'), 3)
})

test('week 1 of a plan always has a deck, even with few big decks over many weeks', () => {
  const plan = buildPlan({ currentLevel: 'B2', targetLevel: 'C1', weeks: 52, minutesPerDay: 60, decks })
  assert.ok(plan.schedule[0].decks.length > 0, 'week 1 is empty')
  const scheduled = plan.schedule.flatMap((w) => w.decks.map((d) => d.id))
  assert.deepEqual(scheduled, decks.filter((d) => cefrOfDeck(d.id) === 'C1').map((d) => d.id))
})
