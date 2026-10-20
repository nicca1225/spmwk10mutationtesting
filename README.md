# The Illusion of Coverage

**IS212 Week 10 Topic Research & Sharing.** Do AI-generated unit tests actually catch bugs, or do they just make the coverage number look good? We measure it with [StrykerJS](https://github.com/stryker-mutator/stryker-js) mutation testing.

---

## The idea in 30 seconds

- **Line coverage** only tells you which lines of code *ran* during the tests. A test can run a line without checking the result is correct.
- **Mutation testing** deliberately plants small bugs in a copy of the code (e.g. `<` becomes `<=`), reruns the *same* tests, and checks whether they notice.
  - A test fails → the planted bug was caught → **killed** (good)
  - All tests still pass → the planted bug slipped through → **survived** (a gap in the tests)
  - **Mutation score** = killed ÷ total mutants
- **The catch:** mutation testing only asks *"if this code changed, would the tests notice?"* It never asks *"was the code right in the first place?"* Only checking against the requirements (the spec) can answer that.

## Results

All tests were written by **Gemini 3.8 Flash** (gemini.google.com, fresh chat each time), given only the code file and the same one-line prompt. Exact prompts and replies are in `prompts/`.

| | Main demo (correct code) | Q4 demo (code with a business-rule bug) |
|---|---|---|
| Gemini's tests | 17 / 17 pass | 17 / 17 pass |
| Line, branch, statement coverage | 100% | 100% |
| Mutation score (StrykerJS) | **98.4%** (63 / 64 killed) | **100%** (64 / 64 killed) |
| Checks written from `q4/SPEC.md` | n/a | **1 of 5 fails** |

**Main demo: the one survivor.** Stryker changed `order.subtotal < 0` to `order.subtotal <= 0` (line 21), which would start rejecting every $0 order. Gemini tested a negative subtotal but never a $0 one, so no test noticed. Coverage said 100%; mutation testing found the gap.

**Q4 demo: "100% coverage, 100% mutation score, still wrong."** The Q4 code checks free shipping against the subtotal *before* discounts, but the spec says *after*. A $82 order with promo SPM10 should pay $5 shipping (the customer pays $73.80) but gets free shipping. Gemini read the buggy code, named its test after the wrong rule (`waives shipping fee if subtotal >= 80`), and never tested a discount pushing the amount below $80. Every automated check passed; only the spec check caught it.

## What's in the repo

| Path | What it is |
|---|---|
| `src/orderPricing.ts` | The module under test (~50 lines): tiered discounts, member/VIP bonus, promo code, 20% cap, shipping rules. |
| `tests/orderPricing.test.ts` | Gemini's tests for the main module, **unedited**. |
| `q4/` | The Q4 demo: `SPEC.md` (business rules), a copy of the module with one planted bug, Gemini's tests for it, and human-written spec checks. See `q4/README.md`. |
| `prompts/` | Session logs: model, date, exact prompt and Gemini's reply for each run. |
| `stryker.config.json` | Stryker setup: Jest runner, per-test coverage, HTML + JSON reports. |

**Baseline fact:** all 64 mutants Stryker generates for this module *can* be killed (checked with a thorough hand-written suite kept outside this repo). So a surviving mutant is a real gap in the tests, not noise.

## Setup

Requires **Node.js 22+** (StrykerJS 10 needs it). Check with `node -v`.

```bash
git pull
npm install
```

## Live demo runbook (read this if you're presenting)

The live demo is three quick switches from the slides to VS Code / the browser. Every command reruns Stryker on the test files already saved in this repo, so **you get the same numbers every time** (Gemini is not called again).

### Before class (do it the day before too)

1. Open this folder in VS Code and open a terminal (**Terminal → New Terminal**). The prompt should end in `spmwk10mutationtesting %`. If not, `cd` there first. Keep the quotes because "IS212 SPM" has a space, and adjust the path to where *you* cloned it:
   ```bash
   cd "/Users/<you>/.../IS212 SPM/mutationtesting_repo/spmwk10mutationtesting"
   ```
2. Get the latest code and install:
   ```bash
   git pull
   npm install
   node -v        # must be 22 or higher
   ```
3. **Dry run every command in the cheat sheet below once.** This also creates the HTML reports that `npm run report` opens.
4. Make the terminal readable from the back of the room: press **Cmd +** several times, then **Cmd K** to clear it.
5. Close Slack, mute notifications, and if the repo is inside OneDrive, pause OneDrive syncing.
6. If anything breaks on the day, **don't debug live**. Go back to the slides; they already have screenshots of the same results.

### During the presentation

| Slide | Run | Point at | Time |
|---|---|---|---|
| **5 · "All green?"** | `npm run coverage` | The coverage table: **100** in every column. "Coverage says this suite is perfect." | ~10s |
| | `npm run mutate` | The final table: **98.44**, **63 killed**, **1 survived**. Just above it, the `[Survived]` block showing `order.subtotal < 0` → `order.subtotal <= 0`. | ~20s |
| **6 · "The one that got away"** | `npm run report` | Opens in the browser. Click `orderPricing.ts`, then the **red dot on line 21**. Red line = original code, green line = Stryker's change. "Every test still passed with this bug in." | ~15s |
| **9 · "Still wrong."** | `npm run q4:spec` | The red **FAIL**: 4 ✓ and 1 ✗. In the diff, **`- "shipping": 5`** (what the spec expects) vs **`+ "shipping": 0`** (what the code did), and total 78.8 vs 73.8. | ~15s |

Optional if you're under time: on slide 8, run `npm run q4:mutate` to show **100.00** (64/64 killed) before revealing the failure on slide 9.

Heads-up: after `npm run q4:spec` fails, npm prints a few extra `npm error` lines at the bottom. That's normal (npm reporting the failed test run). Scroll up to the red FAIL.

### Expected results cheat sheet

| Command | Expected result |
|---|---|
| `npm test` | 17 passed, 17 total |
| `npm run coverage` | 100 / 100 / 100 / 100 (stmts, branch, funcs, lines) |
| `npm run mutate` | Mutation score **98.44**, 63 killed, 1 survived (line 21, `< 0` → `<= 0`) |
| `npm run report` | Opens `reports/mutation/mutation.html`; one red dot on line 21 |
| `npm run q4:test` | 17 passed, 17 total |
| `npm run q4:coverage` | 100 / 100 / 100 / 100 |
| `npm run q4:mutate` | Mutation score **100.00**, 64 killed, 0 survived |
| `npm run q4:report` | Opens `reports/q4-mutation/mutation.html`; no red dots |
| `npm run q4:spec` | 4 passed, **1 failed** (§3 $82 with SPM10: shipping expected 5, received 0) |

`npm run report` and `npm run q4:report` only work after their `mutate` command has run at least once.

### If something goes wrong

| Problem | Fix |
|---|---|
| `command not found: npm`, or `node -v` below 22 | Install Node 22+ from nodejs.org (or `brew upgrade node`) |
| `Cannot find module ...` | Run `npm install` |
| Stryker is very slow or throws odd file errors | Pause OneDrive syncing and run it again |
| `npm run report` doesn't open anything | Open `reports/mutation/mutation.html` in your browser manually |
| Numbers differ from the cheat sheet | Someone edited a file. Run `git status`; if `tests/`, `q4/` or `src/` show as modified, run `git restore tests q4 src` to go back to the committed versions |
| Anything else | Skip the live run and present from the slides |

## Reference: main demo commands (presentation Q2: "Can you show it?")

```bash
npm test          # 17 tests, all green
npm run coverage  # coverage table: 100% across the board
npm run mutate    # Stryker: 98.44% mutation score, 1 survived
npm run report    # opens the HTML report in your browser
```

**What you should see from `npm run mutate`:** a progress bar through 64 mutants, then one `[Survived]` block showing `order.subtotal < 0` → `order.subtotal <= 0`, then a table with **98.44** in the mutation score column. Takes a few seconds.

**In the HTML report:** click `orderPricing.ts`. Green dots are killed mutants, the red dot on line 21 is the survivor. Click it to see the mutation.

## Reference: Q4 demo commands (presentation Q4: "Where does it break?")

```bash
npm run q4:test       # Gemini's tests on the buggy code: 17 / 17 green
npm run q4:coverage   # 100% coverage
npm run q4:mutate     # Stryker: 100% mutation score
npm run q4:report     # opens the Q4 HTML report
npm run q4:spec       # checks against SPEC.md: 4 pass, 1 FAILS
```

**What you should see from `npm run q4:spec`:** a red `FAIL` on *"§3 $82 with SPM10 pays $73.80 after discount, so shipping is NOT free"*, expecting `shipping: 5, total: 78.8` but receiving `shipping: 0, total: 73.8`. That failure is the point of the demo.

The main commands ignore the `q4/` folder and the Q4 commands ignore the main tests, so the two demos never interfere.

## How the tests were generated (if you ever redo it)

1. Open a **fresh** chat in the AI tool. It should see only the code file, not this README (the README describes the bugs).
2. Paste the code file and use this prompt, word for word:
   > Write Jest unit tests in TypeScript for this module. Put them in tests/orderPricing.test.ts and import from ../src/orderPricing.
3. Save the output **unedited** (`tests/` for the main module, `q4/tests/` for Q4).
4. Log the prompt, model, date and full reply in `prompts/`.

Don't rerun the AI until you get a "better" or "worse" score: report what actually happened.

## Honest limitations (good for Q&A)

- **One small, clean module, one model, one run each.** Other models, other runs, or messier real-world code may score differently.
- **Gemini saw only the code**, the way most developers prompt. Giving it the spec might change the Q4 result; that would be a separate experiment.
- **Mutation testing is slow on big codebases** (every mutant reruns tests). Stryker's `--incremental` mode helps by only retesting changed code.
- **Some real-world mutants can't be killed** (equivalent mutants), which drags scores down. This module has none.
