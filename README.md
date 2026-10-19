# The Illusion of Coverage — demo repo

IS212 Week 10 Topic Research & Sharing. Does an AI-generated test suite that hits high line coverage actually catch bugs? We measure it with [StrykerJS](https://github.com/stryker-mutator/stryker-js) mutation testing.

## What's in here

| Path | What it is |
|---|---|
| `src/orderPricing.ts` | The module under test: an order pricing function with tiered discounts, membership bonus, a promo code, a discount cap and shipping rules (~50 lines). |
| `tests/` | Empty on purpose. The AI-generated tests go here, unedited. |
| `prompts/` | The exact prompt used and the AI's raw reply, saved for the slides. |
| `stryker.config.json` | Stryker setup: Jest runner, per-test coverage, HTML + JSON reports. |

**Baseline fact for the talk:** all 64 mutants Stryker generates for this module are killable (checked with a thorough hand-written suite kept outside this repo). So every mutant that survives the AI's tests is a real gap in those tests, not an equivalent-mutant false alarm.

## Setup

Requires **Node.js 22+** (StrykerJS 10 needs it). Check with `node -v`.

```bash
npm install
```

## Generating the AI tests (do this once, carefully)

1. Open a **fresh** chat or IDE session in your AI tool (Copilot, Cursor, Gemini, Claude…). It should see only `src/orderPricing.ts`, not this README.
2. Paste the file and use this prompt, word for word:

   > Write Jest unit tests in TypeScript for this module. Put them in `tests/orderPricing.test.ts` and import from `../src/orderPricing`.

3. Save the AI's output **unedited** to `tests/orderPricing.test.ts`. If an import path has to be fixed to make it run, fix only that and note it.
4. Save the prompt and the AI's full reply in `prompts/` (e.g. `prompts/gemini-2026-10-20.md`), with the tool name, model and date.

## Running the demo

```bash
npm test          # Jest: everything green?
npm run coverage  # Line / branch coverage table
npm run mutate    # Stryker: mutation score + list of surviving mutants
npm run report    # Opens the HTML mutation report in your browser
```

A full Stryker run on this module takes about 10 seconds.

## Optional round 2: AI fixes its own tests

1. Copy the surviving mutants from the Stryker output.
2. In the same AI session, ask it to strengthen the tests so those mutants are killed.
3. Save the new tests as a separate commit, re-run `npm run mutate`, and compare the before/after scores.
4. Read the new assertions critically: do they check the business rule, or just pin whatever the code currently does?

## Recording tips

- Run everything once beforehand so `npm install` is done and the report exists.
- Record the terminal for `npm run coverage` then `npm run mutate`, then switch to the HTML report and click into one surviving mutant.
