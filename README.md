# Flashcards: language learning app

Learn a language at your own pace: remember vocabulary for good with **spaced repetition**,
practice it in **exercises**, and follow a **study plan** built around your level, your goal
and your deadline.

Built with Vue 3 + Vite. No backend yet: content is JSON in `public/data/`, and each
learner's progress is saved in their browser (localStorage).

## Features

- **Flashcards with spaced repetition (FSRS).** After each card, rate Again / Hard / Good /
  Easy; the app schedules the next review. Up to 20 new cards per deck per day. Keyboard:
  `Space` to flip, `1`–`4` to rate. A card is "mastered" once it is remembered for 3+ weeks.
- **Activities.** Decks with a hand-written `exercises.json` use it (8 exercise types).
  Every other deck gets exercises generated from its own cards: match, fill in the blank,
  build the sentence, dictation. Mistakes show the correct answer; a summary ends each session.
- **Placement test.** Adaptive, about 5 minutes; estimates the learner's CEFR level.
- **Study plan.** Current level → target level, deadline, minutes per day, goal. Gives an honest
  feasibility check (hours from Cambridge CEFR estimates), a daily routine, grammar focus per
  level and a week-by-week deck schedule. A saved plan shows on the home page.
- **Languages:** Brazilian Portuguese (A1–B2, C1 in preparation) and French (A1 starter deck).

## Getting started

```sh
npm install
npm run dev        # development server with hot reload
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```

Requires Node `^22.18.0` or `>=24.12.0`.

## Quality checks

```sh
npm test               # unit tests (Node's built-in test runner, tests/*.test.mjs)
npm run validate:data  # every deck in the manifests matches its files
npm run lint           # oxlint + eslint
```

The same checks run on GitHub Actions for every pull request (`.github/workflows/ci.yml`).

## Project layout

```
public/data/
  languages.json                  languages: name, speech voice, grammar topics per level
  manifests/<lang>-manifest.json  the deck list shown to learners
  <lang>/<level>/<deckId>/
    flashcards.json               the cards: front (target language), back (English), pronunciation, context
    exercises.json                optional hand-written exercises
src/
  views/        one file per screen (deck list, flashcards, activities, placement, plan…)
  components/activities/   the 8 exercise types
  utils/        logic without Vue, unit-tested:
    srs.js                spaced repetition + saved progress
    exerciseGenerator.js  exercises from a deck's cards
    studyPlan.js          plan maths (hours, feasibility, weekly schedule)
    placement.js          placement test questions
tests/          unit tests for src/utils
scripts/validate-data.mjs
```

## Adding content

1. Add the deck to `public/data/manifests/<lang>-manifest.json`. Its id must contain the CEFR
   level, e.g. `br-b1-deck46`; that decides its folder (`a1` beginner, `a2` elementary,
   `b1` intermediate, `b2` upper-intermediate, `c1` advanced).
2. Put the cards in `public/data/<lang>/<folder>/<deckId>/flashcards.json`.
3. Run `npm run validate:data`. Decks marked `"comingSoon": true` are shown locked.

To add a language, add it to `languages.json` (with its `speechLang`, e.g. `es-ES`) and create
its manifest.

## Deploying

The app uses clean URLs such as `/learn/br/br-a1-deck1/flashcards`. The host must serve
`index.html` for any unknown path (single-page app fallback). Otherwise refreshing a page
or opening a shared link gives a 404.
