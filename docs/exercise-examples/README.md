# Hand-written exercise examples

Every deck in the app gets its exercises generated from its own flashcards
(`src/utils/exerciseGenerator.js`): match, fill in the blank, build the sentence
and dictation.

These two files are hand-written sets that deck 1 of each language used to have.
They show the other exercise types the app supports: `conjugation`,
`preposition` (contractions), `dialogue` and `nounArticle` (gender sorting).

To give a deck hand-written exercises again, copy a file into the deck's folder as
`exercises.json`, for example:

```
public/data/br/beginner/br-a1-deck1/exercises.json
```

The app uses a deck's `exercises.json` instead of generated exercises whenever
the file exists.
