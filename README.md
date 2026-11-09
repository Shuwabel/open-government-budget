# Ogbe Budget Ledger

A portfolio demo of public budget tracking. A fictional state, Ogbe, allocates money to ministries, pays contractors, receives spending reports and issues completion certificates. Every step is written to a hash-chained ledger that anyone can check in the browser.

**It runs with no keys, no database and no environment variables.** Deploy it to Vercel as is.

## What is real and what is not

- **Real:** each ledger entry is hashed with SHA-256 (Web Crypto) together with the previous entry's hash. Change an old entry and its hash no longer matches, and the check says so.
- **Simulated:** there is no blockchain network, no wallet, no peers and no consensus. The ledger and all records live in your browser's `localStorage`. All names, companies and amounts are fictional.
- A seeded history (59 entries) is generated deterministically, so a `/verify?tx=<hash>` link to a seeded entry works for every visitor. Entries you create yourself exist only in your own browser.

## Try it

| Role | How | What you can do |
| --- | --- | --- |
| Public | no sign-in | Browse `/spending`, read `/ledger`, check any entry on `/verify` |
| Budget office | `/login`, "Enter as the budget officer" | Allocate budget, pay a contractor, approve or reject reports, issue certificates |
| Contractor | `/login`, pick a company | See payments, submit a spending report, view certificates |

The **tamper check** on `/ledger#tamper` edits a stored amount without re-signing it, then shows where the chain breaks. Tick "recalculate the fingerprint" to see the break move to the next link. "Reset the demo data" restores the seed.

## Run it

```bash
npm install
npm run dev
```

```bash
npm run build      # production build
npm run lint
npm test           # ledger, hash and store tests (Vitest)
npm run e2e        # headless role and flow checks, needs a running build and installed Chrome
```

For the e2e run, start a build first (`npm run build && npx next start -p 3111`) and then `npm run e2e`. Set `BASE` to use another address and `SHOTS=<folder>` to save screenshots.

## How it is built

- Next.js 16 (App Router), React 19, Tailwind CSS 4, Recharts, Zustand with `persist`.
- `lib/ledger.ts`: canonical JSON, SHA-256, block creation, chain and entry verification.
- `lib/store.ts`: persisted store. Writes are serialised so every entry links to the one before it.
- `lib/seed.ts`: deterministic seed data (ministries, allocations, contractors, payments, reports, certificates).
- A production system would publish the fingerprints somewhere the budget office cannot rewrite them, and would put real authentication in front of the office and contractor areas.
