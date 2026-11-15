// Saves the learner's study plan settings in this browser.
// Only the inputs are stored; the plan itself is rebuilt from them each time,
// so it always reflects the current decks.
const KEY = 'flashcards:plan:v1'

export function loadSavedPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    return saved && saved.input && saved.langId ? saved : null
  } catch {
    return null
  }
}

export function savePlan(langId, input) {
  const saved = { langId, input, startedAt: new Date().toISOString() }
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    // Storage blocked or full: the plan still shows, it just won't be remembered
  }
  return saved
}

export function clearPlan() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to do
  }
}
