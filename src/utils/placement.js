// Placement test questions: "What does this phrase mean?" with 4 options
// taken from the same level, plus "I don't know" (to discourage guessing).
// Pure function: pass `random` for deterministic tests.

export const QUESTIONS_PER_LEVEL = 5

function shuffle(list, random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function buildLevelQuestions(cards, { random = Math.random, count = QUESTIONS_PER_LEVEL } = {}) {
  // One card per meaning AND per phrase: the same phrase can appear in two decks
  // with slightly different translations, and one must never be a "wrong" option
  const meanings = new Set()
  const phrases = new Set()
  const unique = []
  for (const card of shuffle(cards, random)) {
    if (!card?.front || !card?.back) continue
    const phrase = card.front.trim().toLowerCase()
    if (meanings.has(card.back) || phrases.has(phrase)) continue
    meanings.add(card.back)
    phrases.add(phrase)
    unique.push(card)
  }
  if (unique.length < 4) return []

  return unique.slice(0, count).map((card) => {
    const distractors = shuffle(unique.filter((c) => c !== card), random).slice(0, 3).map((c) => c.back)
    return {
      prompt: card.front,
      answer: card.back,
      options: shuffle([card.back, ...distractors], random),
    }
  })
}
