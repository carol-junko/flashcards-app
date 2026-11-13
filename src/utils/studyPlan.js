// Goal-based study plan: "I'm A1 and want B2 in 12 weeks with 45 min/day".
// Pure functions (no Vue, no fetch) so they can be unit-tested.

export const LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export const LEVEL_NAMES = {
  A0: 'Complete beginner',
  A1: 'Beginner (A1)',
  A2: 'Elementary (A2)',
  B1: 'Intermediate (B1)',
  B2: 'Upper-intermediate (B2)',
  C1: 'Advanced (C1)',
  C2: 'Proficient (C2)',
}

// Approximate guided-learning hours needed to REACH each level from zero
// (midpoints of Cambridge English estimates; similar for English speakers
// learning Portuguese or French). They include practice outside the app.
export const CUMULATIVE_HOURS = { A0: 0, A1: 95, A2: 190, B1: 375, B2: 550, C1: 750, C2: 1100 }

// How study time is split, by goal (percentages of daily minutes)
export const GOALS = {
  general: {
    label: 'General progress',
    split: { flashcards: 35, exercises: 25, listening: 25, speaking: 15 },
  },
  conversation: {
    label: 'Speaking & travel',
    split: { flashcards: 30, exercises: 15, listening: 30, speaking: 25 },
  },
  exam: {
    label: 'Exam (Celpe-Bras, DELF…)',
    split: { flashcards: 30, exercises: 30, listening: 20, speaking: 20 },
  },
  work: {
    label: 'Work & professional',
    split: { flashcards: 35, exercises: 20, listening: 25, speaking: 20 },
  },
}

export const ACTIVITY_LABELS = {
  flashcards: 'Flashcards (spaced repetition)',
  exercises: 'Activities & grammar',
  listening: 'Listening & reading (podcasts, series, articles)',
  speaking: 'Speaking & writing (tutor, language exchange, journal)',
}

export function levelIndex(level) {
  const i = LEVELS.indexOf(level)
  if (i === -1) throw new Error(`Unknown level "${level}"`)
  return i
}

export function cefrOfDeck(deckId) {
  return (/-(a1|a2|b1|b2|c1|c2)-/i.exec(deckId)?.[1] || '').toUpperCase() || null
}

export function hoursBetween(current, target) {
  return Math.max(0, CUMULATIVE_HOURS[target] - CUMULATIVE_HOURS[current])
}

// Highest level reachable from `current` with `hours` of study
export function reachableLevel(current, hours) {
  let best = current
  for (const level of LEVELS.slice(levelIndex(current) + 1)) {
    if (hoursBetween(current, level) <= hours) best = level
  }
  return best
}

// Placement result: the highest level passed in a row, starting from A1.
// results = { A1: { correct: 5, total: 5 }, A2: { correct: 2, total: 5 } }
export const PASS_RATE = 0.8
export function placementLevel(results) {
  let level = 'A0'
  for (const l of LEVELS.slice(1)) {
    const r = results[l]
    if (!r || !r.total || r.correct / r.total < PASS_RATE) break
    level = l
  }
  return level
}

// Spread decks over weeks in course order, roughly the same number of cards per week
export function scheduleDecks(decks, weeks) {
  const total = decks.reduce((sum, d) => sum + d.cardCount, 0)
  const perWeek = total / weeks
  const schedule = Array.from({ length: weeks }, (_, i) => ({ week: i + 1, decks: [], cards: 0 }))
  let assigned = 0
  for (const deck of decks) {
    // Put each deck in the week where its midpoint falls
    const midpoint = assigned + deck.cardCount / 2
    const week = Math.min(weeks - 1, Math.floor(midpoint / perWeek))
    schedule[week].decks.push(deck)
    schedule[week].cards += deck.cardCount
    assigned += deck.cardCount
  }
  return schedule
}

/**
 * @param {object} input
 *   currentLevel, targetLevel: 'A0'…'C2'
 *   weeks: number of weeks until the deadline
 *   minutesPerDay, daysPerWeek: the learner's time budget
 *   goal: key of GOALS
 *   decks: manifest entries ({ id, title, cardCount, comingSoon })
 *   mode: 'fit' (aim for what's reachable in time) or 'target' (keep the target, extend time)
 */
export function buildPlan(input) {
  const { currentLevel, targetLevel, weeks, minutesPerDay, daysPerWeek = 6, goal = 'general', decks = [], mode = 'fit' } = input
  if (levelIndex(targetLevel) <= levelIndex(currentLevel)) {
    throw new Error('The target level must be above the current level')
  }

  const hoursNeeded = hoursBetween(currentLevel, targetLevel)
  const hoursAvailable = (weeks * daysPerWeek * minutesPerDay) / 60
  const feasible = hoursAvailable >= hoursNeeded
  const reachable = reachableLevel(currentLevel, hoursAvailable)

  // What it would take to keep the original target
  const minutesPerDayNeeded = Math.ceil((hoursNeeded * 60) / (weeks * daysPerWeek))
  const weeksNeeded = Math.ceil((hoursNeeded * 60) / (minutesPerDay * daysPerWeek))

  let planLevel = targetLevel
  let planWeeks = weeks
  if (!feasible && mode === 'fit') planLevel = reachable
  if (!feasible && mode === 'target') planWeeks = weeksNeeded

  // Not enough time for even one full level: still work toward the next one
  // and say how far the learner will get (e.g. "about 88% of the way to A2").
  let partialPercent = null
  if (planLevel === currentLevel) {
    planLevel = LEVELS[levelIndex(currentLevel) + 1]
    partialPercent = Math.round((hoursAvailable / hoursBetween(currentLevel, planLevel)) * 100)
  }

  // Decks for every level after the current one, up to the plan's level
  const levelsToStudy = LEVELS.slice(levelIndex(currentLevel) + 1, levelIndex(planLevel) + 1)
  const inRange = decks.filter((d) => levelsToStudy.includes(cefrOfDeck(d.id)))
  const available = inRange.filter((d) => !d.comingSoon)
  const missingLevels = levelsToStudy.filter((l) => !available.some((d) => cefrOfDeck(d.id) === l))

  const split = GOALS[goal]?.split || GOALS.general.split
  const schedule = planWeeks > 0 && available.length ? scheduleDecks(available, planWeeks) : []
  const totalCards = available.reduce((sum, d) => sum + d.cardCount, 0)

  return {
    currentLevel,
    targetLevel,
    planLevel,
    planWeeks,
    partialPercent,
    feasible,
    reachable,
    hoursNeeded,
    hoursAvailable: Math.round(hoursAvailable),
    minutesPerDayNeeded,
    weeksNeeded,
    minutesPerDay,
    daysPerWeek,
    goal,
    dailyMinutes: Object.fromEntries(
      Object.entries(split).map(([k, pct]) => [k, Math.round((minutesPerDay * pct) / 100)])
    ),
    newCardsPerDay: schedule.length ? Math.ceil(totalCards / (planWeeks * daysPerWeek)) : 0,
    totalCards,
    levelsToStudy,
    missingLevels,
    schedule,
  }
}

// Which plan week a date falls in (1-based), given when the plan started
export function currentWeek(startedAt, now = new Date()) {
  const days = Math.floor((new Date(now) - new Date(startedAt)) / 86400000)
  return Math.max(1, Math.floor(days / 7) + 1)
}
