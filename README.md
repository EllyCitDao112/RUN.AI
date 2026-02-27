# RUN.AI Web3 Music Pilot (GitHub Pages + BSC Testnet)

Minimal pilot with a Vite frontend + Hardhat smart contract.

## What it includes

- **Subscriptions:** Artist/User/Merchant with `tier` + `expiry` and native tBNB payments.
- **Per-track licensing:** Purchase a POL license (ERC-721 token) per track.
- **Irys uploads in browser:** Upload cover, audio, and `metadata.json`, then register track.
- **Download gating:** Download allowed if wallet owns license OR has active **User** subscription.
- **Commercial status:** Shows true when **Merchant** subscription is active.
- **CPM optionalization:** Owner/oracle can post periodic CPM reports; UI can view + post.

## Setup

```bash
npm i
npm run compile
```

Copy and fill env values:

```bash
cp .env.example .env
```

## Deploy contract to BSC Testnet

1. Fund deployer wallet with tBNB.
2. Set `PRIVATE_KEY` and `BSC_TESTNET_RPC_URL` in `.env`.
3. Run:

```bash
npm run deploy:bscTestnet
```

Save the deployed address and place it in:

- local `.env` as `VITE_PLATFORM_ADDRESS`
- **GitHub Actions secret** `VITE_PLATFORM_ADDRESS`

## Run/build frontend

```bash
npm run build
```

> Vite base is set in `vite.config.js` to `/RUN.AI/`. If you fork/rename the repo, update this to `/<REPO_NAME>/`.

## GitHub Pages deploy

1. Push to `main`.
2. In GitHub repository settings:
   - **Pages** → Source = **GitHub Actions**.
3. Ensure secret is set:
   - `VITE_PLATFORM_ADDRESS=<deployed_contract_address>`
4. Workflow `.github/workflows/deploy.yml` builds and deploys `dist/`.

## Key files

- `contracts/MusicPilotPlatform.sol`
- `scripts/deploy.js`
- `hardhat.config.js`
- `src/main.js`
- `src/platform.js`
- `src/irys.js`
- `src/metadata.js`
- `.github/workflows/deploy.yml`
