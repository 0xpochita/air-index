# Air Index — frontend

The app and the scripts that publish the protocol. Full documentation lives in
the [repository README](../../README.md).

## Run it

```bash
pnpm install
cp .env.example .env     # RPC + throwaway keys; the registry address is written by bootstrap
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). It reads the live Sepolia
deployment out of the box — connect a wallet, mint from the navbar faucet, and
deposit. Or use [air-index-ens.vercel.app](https://air-index-ens.vercel.app),
which runs against the same contracts.

## Scripts

Everything under `scripts/` signs with a key from `.env` and never runs in the
browser. Publishing an index does not appear here: that happens at `/create`,
signed by the visitor's own wallet.

| Command | What it does |
|---|---|
| `pnpm prove` | 17 assertions against Sepolia — every claim the ENS track asks about |
| `pnpm check:ens` | Role constants, encodings, one live wildcard read |
| `pnpm check:onchain` | Every published index: weights, bytecode, ownership, vault round trip |
| `pnpm probe:w1` · `w2` · `w3` | Wildcard, methodology lock, scoped delegation |
| `pnpm bootstrap` | Registers `airindex.eth` and the protocol registry. One time |
| `pnpm deploy-registrar` | The contract that lends `REGISTER` to anyone. One time |
| `pnpm deploy-tokens [csv\|all]` | Mock ERC20s for the constituents you need |
| `pnpm wire-index <slug>` | Share token, published as `addr(60)` on the index name |
| `pnpm publish-agent <slug> [--revoke]` | Agent namespace and its record-scoped key |
| `pnpm rebalance <name> <sym> <bps>` | Signs as the agent, not the owner |
| `pnpm set-alias <alias> <target>` | Tickers and mirrors |
| `pnpm mirror-namespace [label]` | Namespace aliasing across the registry |
| `pnpm forever-name <slug> [label]` | Max expiry, root roles burnt |

## Layout

```
src/app/          routes
src/components/   ui, one directory per page
src/lib/ens/      deployments, roles, reads, resolution — the ENSv2 surface
src/lib/onchain/  wallet, portfolio, vault actions, index publication
scripts/          everything that signs with a key from .env
```

Two traps worth knowing: Next does not reload env vars without a restart, so a
dev server started before `bootstrap` will not see the registry. And public RPCs
cap `eth_getLogs` at 50k blocks, which is why the deploy block is recorded and
the index listing query is bounded by it.
