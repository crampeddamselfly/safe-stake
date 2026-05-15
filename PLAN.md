# Safenet Beta Staking UI — Full Build Plan (Denna Labs)

## Context

The Safe Ecosystem Foundation opened an RFP
(https://forum.safefoundation.org/t/rfp-safenet-beta-staking-ui-call-for-operators/6992)
to fund **up to 5 independent operators** to run staking UIs for SAFE on
Safenet Beta, reducing centralization risk from the single foundation-run
interface. Grant: **up to 100,000 SAFE per operator**. **Deadline:
2026-05-17** (3 days from today, 2026-05-14).

**Operator entity:** Denna Labs. **ENS:** `safenet-staking.denna.eth`. **Track A:**
permissionless, non-custodial, open-source. **Repo:**
`/Users/emmettbrown/projects/safe-stake` (already cloned;
remote `crampeddamselfly/safe-stake`, currently empty).

User decision: ship a **finished frontend**, not a skeleton, by the
submission deadline. This plan is the day-by-day build path to a working,
deployed UI by 2026-05-17.

A separate work item: file a PR adding the `io.safe.staking-config` schema
to the upstream `denna-spec` repo.

---

## RFP Requirements Mapped

| RFP Requirement | How Met |
|---|---|
| Fully non-custodial | viem-only writes; no backend signs |
| Open-source frontend | MIT; public `crampeddamselfly/safe-stake` |
| Direct Safenet contract interaction | Vendored ABIs from `safe-fndn/safenet-staking-ui` |
| Stake / unstake / claim rewards | All three by end of Day 2 |
| Wallet support: injected, WalletConnect, Safe Apps | Reown AppKit + Safe Apps SDK |
| ≥95% uptime | IPFS via Pinata + Filebase, Vercel mirror, ENS contenthash |
| Implementation diversity | SvelteKit (ref is React) |
| AML/compliance | Sanctions oracle gate (`0x40C57923924B5c5c5455c48D93317139ADDaC8fb`) + geo-block hook |
| Denna Labs entity, KYC-ready | One legal contact for SEF AML check |

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | **SvelteKit + `@sveltejs/adapter-static`** (SPA, hash routing for IPFS) |
| Lang | TypeScript strict (per global CLAUDE.md) |
| Pkg mgr | **Bun** |
| Chain lib | **viem 2.x** (+ `walletActionsEip5792` for batch) |
| Wallet | **Reown AppKit** + `@reown/appkit-adapter-wagmi` (injected + WC v2 + Safe) |
| Safe App | `@safe-global/safe-apps-sdk` + `static/manifest.json` |
| Styling | Tailwind v4 (`@theme` CSS-first) |
| UI primitives | `bits-ui` (Svelte port of Radix) |
| State | Svelte 5 runes + `@tanstack/svelte-query` (15s refetch like ref) |
| Validation | Zod |
| Tests | Vitest (unit) + Playwright (happy-path E2E only for v1) |
| Hosting | IPFS via Pinata + Filebase mirror; Vercel mirror; ENS `safenet-staking.denna.eth` |

---

## Repository Layout

```
safe-stake/
├── src/
│   ├── lib/
│   │   ├── chain/
│   │   │   ├── clients.ts          # viem public/wallet clients
│   │   │   └── chains.ts           # mainnet/sepolia definitions
│   │   ├── contracts/
│   │   │   ├── stakingAbi.ts       # vendored from ref (MIT)
│   │   │   ├── erc20Abi.ts
│   │   │   ├── merkleDropAbi.ts
│   │   │   └── sanctionsOracleAbi.ts
│   │   ├── hooks/
│   │   │   ├── useStakingReads.ts  # balances, queue, validator list
│   │   │   ├── useStakingWrites.ts # stake/unstake/claim (+ EIP-5792)
│   │   │   ├── useRewards.ts       # Merkle proof lookup + claim
│   │   │   └── useSanctions.ts     # oracle gate
│   │   ├── wallet/
│   │   │   ├── appkit.ts           # Reown AppKit init
│   │   │   └── safe.ts             # Safe Apps SDK iframe detect
│   │   ├── analytics/
│   │   │   ├── validators.ts       # scoring, uptime, commission
│   │   │   └── export.ts           # CSV
│   │   ├── spec/
│   │   │   ├── schema.ts           # zod equivalent of io.safe.staking-config
│   │   │   └── loader.ts           # load + validate denna-spec JSON
│   │   └── ui/                     # buttons, tables, modals on bits-ui
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte            # stake / unstake / claim tabs
│   │   ├── validators/+page.svelte
│   │   └── rewards/+page.svelte
│   └── app.css                     # Tailwind @theme tokens
├── config/
│   ├── safe-staking-mainnet.denna-spec.json
│   └── safe-staking-sepolia.denna-spec.json
├── schemas/
│   └── io.safe.staking-config.schema.json
├── static/
│   └── manifest.json               # Safe App manifest
├── e2e/                            # Playwright, mocked RPC
├── scripts/
│   └── verify-merkle.ts            # validate static Merkle JSON
├── .github/workflows/
│   ├── ci.yml                      # lint + type + test
│   ├── deploy-ipfs.yml             # Pinata pin w/ checksum gate
│   └── deploy-vercel.yml
├── LICENSE                         # MIT
├── README.md
├── package.json
├── tsconfig.json
├── svelte.config.js                # adapter-static, prerender all
├── vite.config.ts
└── playwright.config.ts
```

---

## denna-spec Config Layer

**New schema:** `io.safe.staking-config` — extends address-registry pattern
from `/Users/emmettbrown/projects/denna-spec/v1/defi/address-registry.schema.json`.

**Where it lives:** authored locally in `schemas/`, then PR'd into
`denna-spec/v1/safe/staking-config.schema.json`. Until merged, `$schema`
points to a raw GitHub URL on a PR branch; flip to canonical
`https://spec.denna.io/v1/safe/staking-config.schema.json` post-merge.

**Per-chain config file** holds:
- `chainId`, `chainName`, `rpcUrl`, `deployBlock`
- `contracts`: `staking`, `safeToken`, `sanctionsOracle`, `merkleDrop`
- `validators[]`: id, address, name, commissionBps, websiteUrl
- `rewards`: `merkleJsonUrl`, `claimWindowSeconds`
- `features`: `eip5792Batch`, `geoBlock`, `sanctionsGate`

Shape:
```json
{
  "$schema": "https://spec.denna.io/v1/safe/staking-config.schema.json",
  "metadata": {
    "id": "safe-staking-mainnet",
    "kind": "io.safe.staking-config",
    "name": "Safenet Beta Staking — Mainnet",
    "version": "1.0.0",
    "lastUpdated": "2026-05-14"
  },
  "chainId": 1,
  "chainName": "ethereum",
  "deployBlock": 0,
  "contracts": {
    "staking":         "0x115E78f160e1E3eF163B05C84562Fa16fA338509",
    "safeToken":       "0x5aFE3855358E112B5647B952709E6165e1c1eEEe",
    "sanctionsOracle": "0x40C57923924B5c5c5455c48D93317139ADDaC8fb",
    "merkleDrop":      null
  },
  "validators": [],
  "features": { "eip5792Batch": true, "geoBlock": false, "sanctionsGate": true }
}
```

Sepolia file: same shape with chainId `11155111`, staking
`0x40745eec3fD6E4C005de1dec0031b2EA9f9D7c42`, test SAFE
`0xef98bcc90b1373b2ae0d23ec318d3ee70ea61af4`.

`src/lib/spec/loader.ts` imports the JSON, validates with zod
(`src/lib/spec/schema.ts`), and exposes a typed `getConfig(chainId)` to the
app. RPC URL falls back to `VITE_RPC_URL_<chainId>` env var when set.

---

## Core Contract Flows (port from ref)

| Flow | Calls | Notes |
|---|---|---|
| Stake | `SAFE.approve(staking, amount)` → `staking.stake(validator, amount)` | Batch via EIP-5792 when Safe wallet |
| Unstake (initiate) | `staking.initiateWithdrawal(validator, amount)` | FIFO queue, cooldown delay |
| Claim withdrawal | `staking.claimWithdrawal()` | When cooldown elapsed |
| Claim rewards | `merkleDrop.claim(proof, amount)` | Proof from static JSON pinned to IPFS |
| Sanctions gate | `sanctionsOracle.isSanctioned(addr)` | Block writes if true |

ABIs vendored verbatim from `safe-fndn/safenet-staking-ui` (MIT). Attribution
in README + LICENSE-NOTICES.

---

## Validator Analytics (differentiation)

Patterns lifted from:
- `/Users/emmettbrown/projects/denna-kepler-frontend` — validator/position tables
- `/Users/emmettbrown/projects/cambria-rewards` — rewards panels
- `/Users/emmettbrown/projects/denna-spec-browser` — SvelteKit + denna-spec loader

Per-validator surface:
- Total staked, share of network, # delegators
- Commission, last reward epoch
- Sanctions/jailing status
- Uptime placeholder (manual config in v1, computed in v1.1)

Features:
- Sortable / filterable table
- CSV export
- "Recommended" preset: commission < 5%, not sanctioned

Reads via viem only — no backend.

---

## Hosting

1. **IPFS via Pinata** — primary. Workflow mirrors ref's `deploy-ipfs.yml`
   with checksum verification + manual approval gate.
2. **Filebase mirror** — second IPFS pin for redundancy.
3. **ENS** — register/configure `safenet-staking.denna.eth` contenthash → CID;
   served via `.eth.limo` gateway.
4. **Vercel mirror** — custom domain `safenet-staking.dennalabs.io` (or similar)
   for CDN + analytics.
5. **Safe App** — `static/manifest.json`; submit to Safe App registry post-launch.

Combined target ≥95% uptime per RFP.

---

## Day-by-Day Build Plan (May 14 → May 17)

### Day 1 — Wed 2026-05-14 (TODAY)

**Goal:** scaffold + wallet connect + sepolia reads working locally.

- [ ] `bun create svelte@latest` in `safe-stake/` (skeleton, TS strict)
- [ ] Add deps: `viem`, `@reown/appkit`, `@reown/appkit-adapter-wagmi`,
      `@safe-global/safe-apps-sdk`, `@tanstack/svelte-query`,
      `bits-ui`, `zod`, `tailwindcss@next`, `@tailwindcss/vite`
- [ ] `adapter-static` + hash routing in `svelte.config.js`
- [ ] Tailwind v4 `@theme` tokens in `app.css`
- [ ] `src/lib/chain/{clients,chains}.ts` — viem clients for mainnet + sepolia
- [ ] Vendor ABIs from ref into `src/lib/contracts/`
- [ ] `src/lib/spec/` — schema + loader; author both
      `config/safe-staking-{mainnet,sepolia}.denna-spec.json` and
      `schemas/io.safe.staking-config.schema.json`
- [ ] `src/lib/wallet/appkit.ts` — Reown AppKit init w/ Safe + injected + WC v2
- [ ] `src/lib/hooks/useStakingReads.ts` — staked balance, withdrawal queue,
      validator list (TanStack Query, 15s refetch)
- [ ] `+page.svelte` skeleton with stake-balance card + connect button
- [ ] `.env.example`, `README.md` (architecture + fork-and-redeploy steps)
- [ ] LICENSE (MIT) + LICENSE-NOTICES (ABI attribution)
- [ ] `.github/workflows/ci.yml`
- [ ] First commit + push to `crampeddamselfly/safe-stake`
- [ ] Smoke-test on Sepolia: connect MetaMask, see balance

### Day 2 — Thu 2026-05-15

**Goal:** all write flows functional on Sepolia; Vercel preview live.

- [ ] `src/lib/hooks/useStakingWrites.ts` —
      `stake / initiateWithdrawal / claimWithdrawal`
- [ ] EIP-5792 batched approve+stake on Safe (detect via
      `walletActionsEip5792().getCapabilities`)
- [ ] Sanctions gate via `useSanctions.ts` — block writes if oracle returns true
- [ ] Stake tab UI: amount input (Zod-validated), validator picker,
      approval status, tx pending/success/error toasts
- [ ] Unstake tab: queue display + initiate withdrawal form
- [ ] Claim tab: pending withdrawals + claim button
- [ ] WCAG basics: focus rings, aria labels on form controls, color contrast
- [ ] Playwright: one E2E happy-path per flow (mocked RPC)
- [ ] `.github/workflows/deploy-vercel.yml`; deploy preview to
      `safestake-preview.vercel.app`
- [ ] Open denna-spec upstream PR: `feat: io.safe.staking-config schema`

### Day 3 — Fri 2026-05-16

**Goal:** validator analytics, rewards, IPFS deploy, polish, proposal email
ready to send.

- [ ] `src/lib/hooks/useRewards.ts` + MerkleDrop claim flow
- [ ] Static Merkle JSON pinned to IPFS; URL in denna-spec config
- [ ] `/validators` route — sortable analytics table + CSV export
- [ ] `/rewards` route — claimable rewards + claim button
- [ ] `static/manifest.json` (Safe App)
- [ ] `.github/workflows/deploy-ipfs.yml` — Pinata pin + checksum
- [ ] Pin first build to Pinata; capture CID
- [ ] ENS: set `safenet-staking.denna.eth` contenthash → CID
- [ ] Vercel mirror at custom domain
- [ ] README polish: architecture diagram, fork-and-redeploy instructions
- [ ] Screencast (60s): connect → stake → initiate withdrawal → claim
- [ ] Draft proposal email to `rfp+staking@safefoundation.org`

### Day 4 — Sat 2026-05-17 (deadline)

- [ ] Final QA on Sepolia + mainnet read-only
- [ ] Send proposal email: Denna Labs intro, Track A, plan summary, repo link,
      IPFS CID + ENS, Vercel mirror, screencast link, hosting plan
- [ ] Post repo link in the Safe forum thread (optional, after submission)

---

## Critical Files / Reusable Code

**Read from reference (vendor ABIs only):**
- `safe-fndn/safenet-staking-ui` → `src/abi/stakingAbi.ts`,
  `src/hooks/useStakingWrites.ts`, `src/hooks/useStakingReads.ts`,
  `.github/workflows/deploy-ipfs.yml`

**Lift patterns from user's repos:**
- `/Users/emmettbrown/projects/denna-spec-browser` — SvelteKit + denna-spec
  loader (closest precedent — same framework choice)
- `/Users/emmettbrown/projects/denna-kepler-frontend` — validator/position
  tables, dashboard layout
- `/Users/emmettbrown/projects/cambria-rewards` — rewards UI patterns
- `/Users/emmettbrown/projects/denna-spec/v1/defi/address-registry.schema.json`
  — extend for `io.safe.staking-config`
- `/Users/emmettbrown/projects/denna-spec-validator-action` — wire CI
  validation in `ci.yml`

---

## Verification

Each ticked off before submission:

1. **Sepolia full loop** — Playwright: fund → stake → initiate → wait
   cooldown → claim. Green on `main`.
2. **Mainnet read-only** — manual: load with mainnet RPC, see staked balance
   for known address; no writes.
3. **Wallet matrix** — MetaMask, Rabby, WalletConnect v2 (mobile), Safe
   iframe. Stake flow on each.
4. **EIP-5792 batch** — Safe wallet proposes one batched tx for
   approve+stake.
5. **Sanctions gate** — UI blocks writes when oracle returns true (test
   address).
6. **Schema CI** — `daocraft/denna-spec@v1` action green on PR.
7. **IPFS reproducibility** — clean `bun run build` matches pinned CID
   (checksum-verified workflow).
8. **A11y baseline** — `axe-core` in Playwright; zero serious violations on
   stake page.
9. **Lighthouse** — performance + a11y + best-practices ≥90 (best-effort by
   deadline; deeper audit post-acceptance).
10. **ENS resolution** — `safenet-staking.denna.eth.limo` loads UI; matches Pinata
    CID.

---

## Out of Scope for v1 (Submission)

Defer to post-acceptance milestones:
- i18n / multi-language
- Mobile PWA install
- Validator uptime computed from on-chain events
- Full WCAG 2.2 AA audit (only baseline a11y in v1)
- Tx simulation / risk preview
- E2E across full wallet matrix (Playwright covers happy path on one)

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| 3-day full build is tight | Scope locked above; analytics + rewards are last (drop to "static list only" if Day 3 slips) |
| Svelte wagmi ecosystem thinner than React | `@wagmi/core` + Reown AppKit are framework-agnostic; isolate any framework surface behind `lib/wallet/` |
| denna-spec PR not merged by deadline | `$schema` URL points to PR branch; flip on merge |
| Pinata quota | Filebase second pin |
| ABIs change post-SEP-55 | Vendored ABIs; spec config pins per-chain ABI hash later |
| Foundation prefers React diversity | Svelte itself is diversity; emphasize in proposal |
| Mainnet write-bug risk during demo | v1 demo is Sepolia only; mainnet is read-only |

---

## Submission Email Outline

To `rfp+staking@safefoundation.org`:

> **Subject:** Safenet Beta Staking UI Operator — Denna Labs (Track A)
>
> **Team:** Denna Labs — DeFi infra & dashboards (Denna Spec, Denna Kepler,
> Cambria). Lead: <contact>. KYC docs available on request.
>
> **Track:** A — permissionless, non-custodial.
>
> **Solution:** SvelteKit + viem + Reown AppKit. Open-source MIT at
> https://github.com/crampeddamselfly/safe-stake. Config-driven via a new
> `io.safe.staking-config` schema PR'd to denna-spec, so other operators can
> fork and redeploy with one JSON change.
>
> **UI:** `https://safenet-staking.denna.eth.limo` (IPFS + ENS), mirror at
> `https://safenet-staking.dennalabs.io` (Vercel).
>
> **Differentiation:** validator analytics page (commission, share, sanctions
> status, CSV export); fully forkable config layer; non-React stack increases
> implementation diversity.
>
> **Hosting:** Pinata (primary) + Filebase (mirror) + ENS contenthash +
> Vercel + Safe App manifest. Combined ≥95% uptime.
>
> **Repo / screencast / spec PR links** inline.

---

## Open Items User Must Provide

- [ ] Pinata JWT (or auth method)
- [ ] WalletConnect v2 project ID (free at https://cloud.reown.com)
- [ ] ENS owner key for `safenet-staking.denna.eth` contenthash update
- [ ] Vercel team/project for `safenet-staking.dennalabs.io`
- [ ] Denna Labs legal contact + KYC docs for SEF AML
