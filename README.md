# Safe Stake: Independent Safenet Beta Staking UI

> Track A operator submission for the [Safe Ecosystem Foundation RFP](https://forum.safefoundation.org/t/rfp-safenet-beta-staking-ui-call-for-operators/6992).
> Operated by **Denna Labs**. Non-custodial. Open-source under MIT.

A SvelteKit + viem frontend for staking, unstaking, and claiming rewards on Safenet Beta. Designed to be forkable in one JSON change. All chain config lives in two [denna-spec](https://spec.denna.io) documents: `io.denna.defi.address-registry` for contract addresses and `io.safe.staking-ui-config` for validators, features, and reward pointers. Both schemas live in the canonical [`denna-spec`](https://github.com/daocraft/denna-spec) repo.

- **Live (IPFS + ENS):** https://safenet-staking.denna.eth.limo
- **Live (Vercel mirror):** https://staking.safe.denna.io
- **Reference UI:** https://staking.safenet-beta.eth.limo (Foundation-run)

## Why a second interface?

Reducing single-point-of-failure risk for SAFE staking is the explicit goal of the RFP. This UI adds:

- **Stack diversity**: SvelteKit instead of the React reference, distinct bundle, distinct deploy pipeline.
- **Config-driven forkability**: every contract address, RPC URL, validator entry, and Merkle drop pointer is one JSON file. Operators clone the repo, swap the config, redeploy. No code changes.
- **Validator analytics**: sortable table with commission, stake share, sanctions status, CSV export.
- **Multi-pin redundancy**: Pinata + Filebase + Vercel + Safe App manifest. ≥95% combined uptime.

## Architecture

```
src/lib/
├── chain/         viem clients + chain definitions
├── contracts/     ABIs (vendored from reference, MIT-attributed)
├── hooks/         TanStack Query hooks: reads, writes, rewards, sanctions
├── spec/          denna-spec loader + Zod schema mirror
├── wallet/        Reown AppKit + Safe Apps SDK
└── analytics/     validator scoring + CSV export
src/routes/
├── +page.svelte             stake / unstake / claim
├── validators/+page.svelte  analytics
└── rewards/+page.svelte     MerkleDrop claim
config/
├── safenet-contracts.denna-spec.json   # io.denna.defi.address-registry (canonical)
└── safe-stake-ui.denna-spec.json       # io.safe.staking-ui-config (extension)
```

## Fork & redeploy

1. `git clone https://github.com/daocraft/safe-stake your-fork`
2. Edit `config/safenet-contracts.denna-spec.json` (addresses per chain) and `config/safe-stake-ui.denna-spec.json` (validators, features, rewards). Both are canonical [denna-spec](https://schemas.denna.io) files.
3. Update `static/manifest.json` with your Safe App name and icon.
4. `bun install && bun run build` → static SPA in `build/`.
5. Pin to IPFS (`pinata-cli pin build/`) or deploy to Vercel.
6. Optional: point an ENS contenthash at the resulting CID.

## Development

```bash
bun install
cp .env.example .env  # fill in VITE_REOWN_PROJECT_ID
bun run dev           # http://localhost:5173
bun run check         # type + lint
bun run test          # vitest
bun run test:e2e      # playwright
bun run validate:spec # JSON Schema check on config/
```

## Environment

| Variable                | Required | Purpose                                                               |
| ----------------------- | -------- | --------------------------------------------------------------------- |
| `VITE_REOWN_PROJECT_ID` | yes      | Reown / WalletConnect v2 project id (free at https://cloud.reown.com) |
| `VITE_RPC_URL_1`        | no       | Override mainnet RPC                                                  |
| `VITE_DEFAULT_CHAIN_ID` | no       | Initial chain id (default `1`)                                        |
| `VITE_SITE_ORIGIN`      | no       | Canonical origin for OG + Safe App manifest                           |

## Contract addresses

Loaded from `config/safenet-contracts.denna-spec.json` (`io.denna.defi.address-registry`). Current defaults:

| Network     | Staking                                      | SAFE token                                   | Sanctions Oracle                             |
| ----------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| Mainnet (1) | `0x115E78f160e1E3eF163B05C84562Fa16fA338509` | `0x5aFE3855358E112B5647B952709E6165e1c1eEEe` | `0x40C57923924B5c5c5455c48D93317139ADDaC8fb` |

## Acknowledgements

ABIs and contract integration patterns are vendored from [safe-fndn/safenet-staking-ui](https://github.com/safe-fndn/safenet-staking-ui) (MIT). See [`LICENSE-NOTICES.md`](./LICENSE-NOTICES.md).

## License

MIT © 2026 Denna Labs
