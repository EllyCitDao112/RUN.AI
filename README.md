# RUN.AI Web3 Music Pilot (GitHub Pages + BSC Testnet)

Minimal pilot with a Vite frontend + Hardhat smart contract.

## What it includes

- **Subscriptions:** Artist/User/Merchant with `tier` + `expiry` and native tBNB payments.
- **Per-track licensing:** Purchase a POL license (ERC-721 token) per track.
- **Irys uploads in browser:** Upload image/audio/video media with MIME tagging, then upload `metadata.json` and register track.
- **Download gating:** Download allowed if wallet owns license OR has active **User** subscription.
- **Commercial status:** Shows true when **Merchant** subscription is active.
- **CPM optionalization:** Owner/oracle can post periodic CPM reports; UI can view + post.

## Setup

Copy and fill env values:

```bash
cp .env.example .env
```

Run environment diagnostics:

```bash
npm run env:doctor
```

Install/build flow:

```bash
npm i
npm run compile
```

If npm install fails with proxy/403 issues, run:

```bash
npm run setup:local
```


## Manual guide to correct warning

If `npm run env:doctor` shows warning/error, run these commands in order:

```bash
cp .env.example .env
# edit .env and set PRIVATE_KEY, BSC_TESTNET_RPC_URL, VITE_PLATFORM_ADDRESS
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY npm_config_http_proxy npm_config_https_proxy
npm config delete proxy
npm config delete https-proxy
npm run env:doctor
npm i
```

If your organization requires a proxy, set approved proxy values instead of unsetting them.


### Rebuild command (fix common setup issues)

Run a full local rebuild that checks env, clears proxy config for the run, installs dependencies, compiles contracts, and builds frontend:

```bash
npm run rebuild
```


### Manual file load when npm registry is blocked

If `npm run rebuild` still fails at dependency install due registry/proxy policy, load package files manually:

1. On a machine that can access npm, download tarballs (top-level + missing transitive deps):

```bash
mkdir -p vendor/npm
npm pack vite@5.4.10
npm pack hardhat@2.22.15
npm pack ethers@6.13.4
npm pack @irys/sdk@0.2.9
# move *.tgz files into vendor/npm and copy this folder to the blocked machine
```

2. On this repo, place tarballs in `vendor/npm/` and run:

```bash
npm run setup:manual
```

3. Re-run rebuild:

```bash
npm run rebuild
```

> Note: you may need to add additional transitive dependency tarballs if npm reports missing packages.

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
4. Workflow `.github/workflows/deploy.yml` builds on pushes and pull requests; deploy to Pages runs only for non-PR events.
5. If the page shows source files/blank content, re-check **Settings → Pages → Build and deployment → Source = GitHub Actions**.


### Display simulation mode

For demo/screenshare without wallet or RPC, click **Display Simulation** in the UI, or open:

```
https://<user>.github.io/RUN.AI/?simulate=1
```

This renders sample subscription, track, download-gate, and CPM data client-side only.

Media upload notes:
- Cover file must be image/*
- Audio accepts audio/* or video/*
- Max upload size per media file: 100MB


## Featured image setup

To show your provided image in the app, place it at:

- `public/blockchain-chucky.svg`

The frontend resolves it with Vite `BASE_URL`, so it works both locally and on GitHub Pages (`/RUN.AI/`).

## Key files

- `contracts/MusicPilotPlatform.sol`
- `scripts/deploy.js`
- `hardhat.config.js`
- `src/main.js`
- `src/platform.js`
- `src/irys.js`
- `src/metadata.js`
- `.github/workflows/deploy.yml`
