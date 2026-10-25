# Mindbranch + Bodybranch

**Use when** working on Mindbranch or Bodybranch.

Two question-driven differential walkers in one buildless browser app. Live at
<https://mindbranch-4qt.pages.dev>. Bodybranch opens directly at
<https://mindbranch-4qt.pages.dev/#bodybranch>.

Keep the address stable, unlisted and `noindex, nofollow`. Both tabs share the
existing garden background, local music and click sounds.

## The two paths

| Path | Content | Result |
| --- | --- | --- |
| Mindbranch | DSM-5-TR framing, 25 screen gates, 28 modules and 20 differential rules | Criteria met, near threshold, unresolved, or excluded with the reason |
| Bodybranch | Adult physical health: 18 symptom areas, 164 possible questions and 99 candidate patterns | A ranked shortlist with supporting clues, conflicting clues, unknowns and the assessment needed to distinguish each candidate |

Mindbranch keeps its own engine, queue and saved progress. Bodybranch is an
additional path, not a conversion of the psychiatric model.

## Bodybranch model

Start with current emergency symptoms and adult scope. Ask about age, relevant
anatomy, duration, course, affected areas, warning signs, medicine changes and
tests performed during the same symptom episode. Open only relevant system
branches and their conditional follow-ups.

Coverage includes endocrine, nutritional, cardiac, respiratory, digestive,
urologic, reproductive, neurological, musculoskeletal, skin, eye/nasal, sleep
and infectious patterns. It is broad adult coverage, not an exhaustive medical
encyclopedia or a pediatric pathway.

Rank by weighted supporting/conflicting features and characteristic core clues.
Never present those weights as disease probabilities or percentages. This is
an authored pattern model, not a calibrated or clinically validated risk model.
A distinctive feature or reported test can open a possible candidate without
confirming a diagnosis. Stronger matches require several clinical clues.

The clinical safeguards are part of the reasoning:

- Current emergency symptoms interrupt the routine differential. Same-day and
  prompt-assessment alerts stay above all routine candidates.
- Missing, skipped and uncertain answers never become negatives. An uncertain
  parent preserves follow-up questions.
- Use only answers on the currently reachable path. Retain hidden answers for
  reversible editing, but make them inert until the branch reopens.
- High FT4 with nonsuppressed TSH does not establish active Graves. Negative
  anti-TPO is not a Graves-specific exclusion.
- Iron depletion and anemia are different findings. Within-range folate is
  not confirmed folate deficiency.
- A celiac negative with uncertain IgA/gluten status remains unresolved. ACTH
  alone is not a cortisol assessment.
- Bowel alarm features prevent an IBS-only conclusion. Secondary causes weaken
  a primary standing-tachycardia syndrome label.
- Duration requirements matter; a single crash cannot establish ME/CFS.

`body-data.js` owns all clinical questions, candidates, source links, urgent
triggers and explanatory differential rules. Change clinical content there,
not inside UI code. Each candidate links to a primary medical resource.

Marking a candidate already diagnosed moves it below new explanations without
erasing its evidence. Results also support answer replay, missing-clue links,
a discussion summary, printing and separate answer export/import.

## Architecture and saved state

| Files | Responsibility |
| --- | --- |
| `index.html` | Shared shell, two tabs, living background and script order |
| `data.js`, `engine.js`, `app.js` | Original Mindbranch content, pure evaluation and UI |
| `art.js`, `photos/`, `refetch_photos.py` | Mindbranch question photographs and deterministic source map |
| `styles.css` | Existing palette and Mindbranch presentation |
| `body-data.js` | Bodybranch questions, candidate patterns, references and rules |
| `body-engine.js` | Pure queue construction, input sanitization, ranking and diff |
| `body-app.js`, `body.css` | Scoped Bodybranch UI, tab routing, persistence and export |
| `tests/bodybranch.test.cjs` | Clinical-pattern, exclusion, uncertainty and regression scenarios |

Load the existing four scripts first, then the three Bodybranch scripts. The
Bodybranch UI owns only its panel and namespace. Do not replace the original
`#app` renderer or its storage key.

Answers are browser-local. Preserve `mindbranch-v1`, `bodybranch-v1` and
`mindbranch-music-enabled-v1`; changing a key can strand a returning user's run.
The two paths have separate answer files and import formats. Bodybranch accepts
only its versioned envelope and recognized question/option values. No answers
are imported from a personal profile, inferred from the other tab or sent to a
server.

## Mindbranch invariants

- Paraphrase criteria rather than copying the manual's wording.
- A yes or not-sure screen opens the relevant modules.
- Prune shared-question groups together. Bipolar modules share evidence.
- Try all three yes/no/unsure values when proving a group dead; a no can satisfy
  a criterion.
- Never prune an unanswered item read by a differential rule. `RULE_ITEMS`
  discovers these dependencies from the rule functions.
- A revived branch owes its missing questions; it stays unresolved until they
  are answered. A skip must never be silently scored as a no.
- Keep photographs uncropped with their real dimensions. Use landscapes,
  textures, architecture and still life rather than people in distress.

Bodybranch uses its own vector anatomy and body-system marks rather than
reusing Mindbranch's question photographs.

## Verification and deployment

From this project directory:

```text
node --test tests/bodybranch.test.cjs
node --check body-data.js
node --check body-engine.js
node --check body-app.js
```

Tests cover every candidate's reachability, unknown inputs, stale hidden
answers, all emergency selections, adult scope, anatomy gates, branch changes,
test-result contradictions and representative leading patterns. Also exercise
actual browser navigation, a complete run, answer editing, saved progress and
switching between the two tabs.

From the workspace root:

```text
just html-preview "Ross/Github/Mindbranch/index.html" 8776
just host-deploy mindbranch
```

There is no transpilation, bundler or server dependency. `build.py` checks the
code and stages only browser files, photos and audio in `.preview/deploy/`.
The existing Cloudflare Pages project `mindbranch` is registered in
`Pipelines/sites/sites.json` with that package as its deploy directory. Keep the
project name and URL stable. Scratch files, tests and documentation stay out
of the public upload.
Hosting rules live in `Knowledge/sites.md`; project-specific rules live here.

For the original image map, `python refetch_photos.py` verifies source identities
and dimensions without changing files. `--refetch --apply` deliberately rebuilds
it. Keep captures, test fixtures and backups inside `.preview/`.
