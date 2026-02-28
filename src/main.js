import "./style.css";
import { ethers } from "ethers";
import { buildMetadata } from "./metadata";
import { uploadFile, uploadJson } from "./irys";
import { connectWallet, getPlatformContract, ROLES, priceKey } from "./platform";

const app = document.querySelector("#app");

app.innerHTML = `
  <h1>RUN.AI Music Pilot</h1>
  <button id="connect">Connect Wallet</button>
  <button id="simulate" class="ghost">Display Simulation</button>
  <p id="account">Not connected</p>

  <section>
    <h2>1) Subscription</h2>
    <label>Role
      <select id="subRole">
        <option>Artist</option><option>User</option><option>Merchant</option>
      </select>
    </label>
    <label>Tier <input id="subTier" type="number" min="1" value="1" /></label>
    <label>Days <input id="subDays" type="number" min="1" value="30" /></label>
    <button id="buySub">Buy Subscription</button>
  </section>

  <section>
    <h2>2-3) Upload (Irys) + Register Track</h2>
    <label>Title <input id="title" /></label>
    <label>Description <input id="description" /></label>
    <label>License Price (tBNB) <input id="price" value="0.001" /></label>
    <label>Cover <input id="cover" type="file" accept="image/*" /></label>
    <label>Audio <input id="audio" type="file" accept="audio/*" /></label>
    <button id="register">Upload + Register</button>
  </section>

  <section>
    <h2>4-5) Download Gate + Commercial Status</h2>
    <label>Track ID <input id="gateTrackId" type="number" value="0" /></label>
    <button id="checkGate">Check Access & Open Audio</button>
    <button id="checkMerchant">Check Merchant Status</button>
    <label>Buy License Track ID <input id="licenseTrackId" type="number" value="0" /></label>
    <button id="buyLicense">Buy License</button>
  </section>

  <section>
    <h2>6) CPM Reports</h2>
    <label>Track ID <input id="cpmTrackId" type="number" value="0" /></label>
    <button id="viewCpm">View Reports</button>
    <label>Start (unix) <input id="cpmStart" type="number" /></label>
    <label>End (unix) <input id="cpmEnd" type="number" /></label>
    <label>CPM <input id="cpmValue" type="number" /></label>
    <label>Notes <input id="cpmNotes" /></label>
    <button id="postCpm">Post Report (owner/oracle)</button>
  </section>

  <section id="simSection" class="hidden">
    <h2>Simulation Output</h2>
    <div id="simCards"></div>
  </section>

  <pre id="log"></pre>
`;

const log = (msg) => {
  const el = document.querySelector("#log");
  el.textContent = `${new Date().toISOString()} ${msg}\n${el.textContent}`;
};

const withGuard = (fn) => async () => {
  try {
    await fn();
  } catch (err) {
    log(`Error: ${err?.message || err}`);
  }
};

const now = Math.floor(Date.now() / 1000);
const simulation = {
  wallet: "0xF00D...BEEF",
  subscriptions: [
    { role: "Artist", tier: 1, expiry: now + 86400 * 30, active: true },
    { role: "User", tier: 1, expiry: now + 86400 * 15, active: true },
    { role: "Merchant", tier: 1, expiry: now - 10, active: false }
  ],
  track: {
    id: 7,
    title: "Neon Pulse",
    metadataUri: "https://gateway.irys.xyz/sim-meta",
    coverUri: "https://gateway.irys.xyz/sim-cover",
    audioUri: "https://gateway.irys.xyz/sim-audio",
    licensePrice: "0.001 tBNB"
  },
  gate: { licensed: false, userSubActive: true, canDownload: true },
  cpm: [
    { period: "2026-02-01 to 2026-02-15", cpm: "1250000000000000 wei", notes: "Launch promo" },
    { period: "2026-02-16 to 2026-02-27", cpm: "950000000000000 wei", notes: "Organic only" }
  ]
};

function renderSimulation() {
  const section = document.querySelector("#simSection");
  const cards = document.querySelector("#simCards");

  const subRows = simulation.subscriptions
    .map((s) => `${s.role} T${s.tier} • ${s.active ? "active" : "inactive"} • expiry ${new Date(s.expiry * 1000).toISOString()}`)
    .join("<br/>");

  const cpmRows = simulation.cpm.map((r) => `${r.period} • ${r.cpm} • ${r.notes}`).join("<br/>");

  cards.innerHTML = `
    <article class="simCard">
      <h3>Wallet</h3>
      <p>${simulation.wallet}</p>
    </article>
    <article class="simCard">
      <h3>Subscriptions</h3>
      <p>${subRows}</p>
    </article>
    <article class="simCard">
      <h3>Track #${simulation.track.id}</h3>
      <p><strong>${simulation.track.title}</strong><br/>${simulation.track.licensePrice}<br/>${simulation.track.metadataUri}</p>
    </article>
    <article class="simCard">
      <h3>Download Gate</h3>
      <p>licensed=${simulation.gate.licensed}<br/>userSubActive=${simulation.gate.userSubActive}<br/>canDownload=${simulation.gate.canDownload}</p>
    </article>
    <article class="simCard">
      <h3>CPM Reports</h3>
      <p>${cpmRows}</p>
    </article>
  `;

  section.classList.remove("hidden");
  log("Simulation displayed (no wallet/contract calls required).");
}

let wallet;

document.querySelector("#connect").onclick = withGuard(async () => {
  wallet = await connectWallet();
  document.querySelector("#account").textContent = wallet.address;
  log(`Connected ${wallet.address}`);
});

document.querySelector("#simulate").onclick = () => renderSimulation();

document.querySelector("#buySub").onclick = withGuard(async () => {
  const role = ROLES[document.querySelector("#subRole").value];
  const tier = Number(document.querySelector("#subTier").value);
  const days = Number(document.querySelector("#subDays").value);
  const contract = getPlatformContract(wallet.signer);
  const daily = await contract.subscriptionPricePerDay(priceKey(role, tier));
  const total = daily * BigInt(days);
  const tx = await contract.subscribe(role, tier, days, { value: total });
  await tx.wait();
  log(`Subscription success tx=${tx.hash}`);
});

document.querySelector("#register").onclick = withGuard(async () => {
  const title = document.querySelector("#title").value;
  const description = document.querySelector("#description").value;
  const price = ethers.parseEther(document.querySelector("#price").value || "0");
  const cover = document.querySelector("#cover").files[0];
  const audio = document.querySelector("#audio").files[0];

  if (!cover || !audio) throw new Error("cover and audio are required");

  const coverUri = await uploadFile(wallet.provider, cover);
  const audioUri = await uploadFile(wallet.provider, audio);
  const metadata = buildMetadata({ title, artist: wallet.address, description, coverUri, audioUri });
  const metadataUri = await uploadJson(wallet.provider, metadata);

  const contract = getPlatformContract(wallet.signer);
  const tx = await contract.registerTrack(title, metadataUri, coverUri, audioUri, price);
  await tx.wait();
  log(`Track registered tx=${tx.hash} metadata=${metadataUri}`);
});

document.querySelector("#buyLicense").onclick = withGuard(async () => {
  const trackId = Number(document.querySelector("#licenseTrackId").value);
  const contract = getPlatformContract(wallet.signer);
  const track = await contract.tracks(trackId);
  const tx = await contract.purchaseLicense(trackId, { value: track.licensePrice });
  await tx.wait();
  log(`License purchased tx=${tx.hash}`);
});

document.querySelector("#checkGate").onclick = withGuard(async () => {
  const trackId = Number(document.querySelector("#gateTrackId").value);
  const contract = getPlatformContract(wallet.provider);
  const [allowed, track] = await Promise.all([contract.canDownload(wallet.address, trackId), contract.tracks(trackId)]);

  log(`Download allowed=${allowed}`);
  if (allowed) window.open(track.audioUri, "_blank");
});

document.querySelector("#checkMerchant").onclick = withGuard(async () => {
  const contract = getPlatformContract(wallet.provider);
  const status = await contract.isCommerciallyActive(wallet.address);
  log(`Merchant commercial status=${status}`);
});

document.querySelector("#viewCpm").onclick = withGuard(async () => {
  const trackId = Number(document.querySelector("#cpmTrackId").value);
  const contract = getPlatformContract(wallet.provider);
  const reports = await contract.getCpmReports(trackId);
  log(`CPM reports: ${JSON.stringify(reports, null, 2)}`);
});

document.querySelector("#postCpm").onclick = withGuard(async () => {
  const trackId = Number(document.querySelector("#cpmTrackId").value);
  const start = Number(document.querySelector("#cpmStart").value);
  const end = Number(document.querySelector("#cpmEnd").value);
  const cpm = Number(document.querySelector("#cpmValue").value);
  const notes = document.querySelector("#cpmNotes").value;
  const contract = getPlatformContract(wallet.signer);
  const tx = await contract.postCpmReport(trackId, start, end, cpm, notes);
  await tx.wait();
  log(`CPM posted tx=${tx.hash}`);
});

if (new URLSearchParams(window.location.search).get("simulate") === "1") {
  renderSimulation();
}
