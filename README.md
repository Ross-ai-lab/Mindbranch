# Mindbranch + Bodybranch

**Use when** working on Mindbranch or Bodybranch.

**Owner ruling, 26 October 2026:** This is a personal project for research only.
No people will ever use it. Keep this designation in this project KB document
only; do not add it to the site UI or change access, logins or availability
because of it.

Two question-driven differential walkers in one buildless browser app. Live at
<https://mindbranch-4qt.pages.dev>; Bodybranch opens directly at
<https://mindbranch-4qt.pages.dev/#bodybranch>. Keep the address stable,
unlisted and `noindex, nofollow`. Both tabs share the garden background, local
music and click sounds.

| Path | Content | Result |
| --- | --- | --- |
| Mindbranch | DSM-5-TR framing, 25 screen gates, 28 modules, 20 differential rules | Criteria met, near threshold, unresolved, settled early, or excluded with the reason |
| Bodybranch | Adult physical health: 18 symptom areas, 159 possible questions, 99 candidate patterns | A ranked shortlist with supporting and conflicting clues, missing clues and the assessment that would distinguish each candidate |

Mindbranch keeps its own engine, queue and saved progress. Bodybranch is an
additional path, not a conversion of the psychiatric model.

## Flow

Reload returns straight to a saved run. A yes/no or single-choice answer
advances on the tap; tick-lists use Next. On a result, changing an answer
re-runs at once and reports what moved. Both tabs export and import their own
answer files, and Bodybranch also saves a discussion summary and prints.

## Mindbranch invariants

- Paraphrase criteria rather than copying the manual's wording.
- A yes or not-sure screen (or the framing stressor item) opens its modules,
  through each item's `opens` list.
- Ask each thing once. Where a screen already asks a criterion, the module
  reads the screen answer with the criterion's own strictness (for example
  two years of low mood must be a yes to be met; not sure stays near).
- Prune shared-question groups together; Bipolar modules share evidence.
- Try all three yes/no/unsure values when proving a group dead; a no can
  satisfy a criterion. Multi items try only "all ticked", which is exact only
  while every multi criterion and near test is a count that rises with ticks.
- Never prune an unanswered item read by a differential rule. `RULE_ITEMS`
  discovers these dependencies from the rule functions.
- A revived branch owes its missing questions and stays unresolved until they
  are answered. A skip is never scored as a no.
- Photographs are uncropped with their real dimensions: landscapes, textures,
  architecture and still life, never people in distress.

## Bodybranch model

Start with current emergency symptoms, adult scope and the symptom areas, then
the rest of the context. Open only branches for the chosen areas. Within an
open branch a question is asked only when a candidate still in play, a safety
alert or the gate of an asked follow-up reads it; nothing else can change the
result. Follow-ups that an earlier answer rules out are skipped, and an
uncertain parent keeps them.

Rank by weighted supporting/conflicting features and characteristic core
clues. Never present those weights as probabilities or percentages: this is
an authored pattern model, not a calibrated or validated risk model. One
distinctive feature or reported test can open a possible candidate without
confirming it; stronger matches need several clues. Every area a candidate
lists must be able to reach it (a test enforces this).

Clinical safeguards are part of the reasoning:

- Current emergency symptoms interrupt the routine differential. Same-day and
  prompt-assessment alerts stay above all routine candidates.
- Missing, skipped and uncertain answers never become negatives.
- Use only answers on the currently reachable path. Hidden answers are kept
  for reversible editing but stay inert, including through chains of gates.
- High FT4 with nonsuppressed TSH does not establish active Graves. Negative
  anti-TPO is not a Graves-specific exclusion.
- Iron depletion and anemia are different findings. Within-range folate is not
  confirmed folate deficiency.
- A celiac negative with uncertain IgA/gluten status remains unresolved. ACTH
  alone is not a cortisol assessment.
- Bowel alarm features prevent an IBS-only conclusion. Secondary causes weaken
  a primary standing-tachycardia syndrome label.
- Duration requirements matter; a single crash cannot establish ME/CFS.

`body-data.js` owns all clinical content: questions and their gates,
candidates, source links, emergency explanations, alerts and explanatory
differential rules. Rules may use `not(q, value)`; warning signs are asked once
for everyone and feed candidates directly. Each candidate links to a specific
primary medical page. Marking a candidate already diagnosed moves it below new
explanations without erasing its evidence.

## Architecture and saved state

| Files | Responsibility |
| --- | --- |
| `index.html` | Shared shell, two tabs, living background and script order |
| `data.js`, `engine.js`, `app.js` | Mindbranch content, pure evaluation and UI; `app.js` also owns site music and click sounds |
| `art.js`, `photos/`, `refetch_photos.py` | Mindbranch question photographs and their deterministic source map |
| `styles.css` | Shared palette, background and Mindbranch presentation |
| `body-data.js`, `body-engine.js` | Bodybranch clinical content; pure queue, sanitization, ranking and diff |
| `body-app.js`, `body.css` | Scoped Bodybranch UI, persistence, export and the shared tab routing |
| `tests/` | `bodybranch.test.cjs` and `mindbranch.test.cjs`; `index.js` runs both |

Load the four Mindbranch scripts first, then the three Bodybranch scripts.
The Bodybranch UI owns only its panel and namespace; do not replace `#app` or
its storage key.

Answers are browser-local. Preserve `mindbranch-v1`, `bodybranch-v1` and
`mindbranch-music-enabled-v1`; changing a key strands a returning user's run.
Each tab sanitizes saved and imported answers to known questions and values.
Bodybranch accepts only its versioned envelope. Nothing is imported from a
profile, inferred from the other tab or sent to a server.

## Verification and deployment

From this project directory:

```text
node --test tests/
node --check data.js art.js engine.js app.js body-data.js body-engine.js body-app.js
```

Also exercise real browser navigation: a complete run on each tab, answer
editing, reload restoring progress, tab switching and phone width without
horizontal scroll.

From the workspace root:

```text
just html-preview "Ross/Github/Mindbranch/index.html" 8776
just host-deploy mindbranch
```

There is no transpilation, bundler or server dependency. `build.py` checks the
code, runs the tests and stages only browser files, photos and audio in
`.preview/deploy/` for the existing Cloudflare Pages project `mindbranch`
(registered in `Pipelines/sites/sites.json`). Keep the project name and URL
stable; scratch files, tests and documentation stay out of the upload. Hosting
rules live in `Knowledge/sites.md`. Bump the `?v=` asset versions in
`index.html` when shipping changed scripts or styles.

`python refetch_photos.py` verifies the photograph set against its sources and
dimensions without changing files; `--refetch --apply` rebuilds it. Keep
captures, fixtures and backups inside `.preview/`.
