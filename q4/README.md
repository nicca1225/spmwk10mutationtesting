# Q4 demo: "Where does it break?"

Mutation testing checks whether the tests would catch the code **changing**. It never checks whether the code was **right in the first place**. This folder shows that gap.

## What's here

| Path | What it is |
|---|---|
| `SPEC.md` | The business rules, written like a product requirement. The "real answer key". |
| `src/orderPricing.ts` | A copy of the main module with **one planted business-rule bug** (see below). |
| `tests/` | Empty on purpose. Gemini's freshly generated tests for this Q4 code go here, unedited. |
| `spec-checks/` | 5 checks a human wrote from `SPEC.md`, not from the code. One is expected to fail. |

### The planted bug (don't show this to Gemini)

SPEC.md §3 says free shipping depends on what the customer pays **after** discounts. The Q4 code checks the subtotal **before** discounts instead:

```diff
- if (afterDiscount < FREE_SHIPPING_FROM && order.tier !== 'vip') {   // main module (correct)
+ if (order.subtotal < FREE_SHIPPING_FROM && order.tier !== 'vip') {  // Q4 module (bug)
```

Example: $82 order with promo SPM10 → customer pays $73.80, so shipping should be $5. The Q4 code gives free shipping.

## Generating the Q4 tests (same setup as the main demo)

1. Fresh Gemini 3.8 Flash chat on gemini.google.com.
2. Paste **only** `q4/src/orderPricing.ts`. Not SPEC.md, not this README.
3. Same prompt, word for word:

   > Write Jest unit tests in TypeScript for this module. Put them in tests/orderPricing.test.ts and import from ../src/orderPricing.

4. Save the output unedited as `q4/tests/orderPricing.test.ts`.
5. Log the session in `prompts/gemini-q4-<date>.md`, same format as the first log.

## Running it (from the project root)

```bash
npm run q4:test       # Gemini's tests on the Q4 code: expect all green
npm run q4:coverage   # coverage table
npm run q4:mutate     # Stryker mutation score
npm run q4:report     # opens the Q4 mutation report
npm run q4:spec       # checks against SPEC.md: expect the shipping check to FAIL
```

The main demo commands (`npm test`, `npm run mutate`, …) ignore this folder completely.
