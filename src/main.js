import "./style.css";
import { ethers } from "ethers";
import { buildMetadata } from "./metadata";
import { uploadFile, uploadJson } from "./irys";
import { connectWallet, getPlatformContract, ROLES, priceKey } from "./platform";

const app = document.querySelector("#app");

app.innerHTML = `
  <h1>RUN.AI Music Pilot</h1>
  <button id="connect">Connect Wallet</button>
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

  <pre id="log"></pre>
`;

const log = (msg) => {
  const el = document.querySelector("#log");
  el.textContent = `${new Date().toISOString()} ${msg}\n${el.textContent}`;
};

let wallet;

document.querySelector("#connect").onclick = async () => {
  wallet = await connectWallet();
  document.querySelector("#account").textContent = wallet.address;
  log(`Connected ${wallet.address}`);
};

document.querySelector("#buySub").onclick = async () => {
  const role = ROLES[document.querySelector("#subRole").value];
  const tier = Number(document.querySelector("#subTier").value);
  const days = Number(document.querySelector("#subDays").value);
  const contract = getPlatformContract(wallet.signer);
  const daily = await contract.subscriptionPricePerDay(priceKey(role, tier));
  const total = daily * BigInt(days);
  const tx = await contract.subscribe(role, tier, days, { value: total });
  await tx.wait();
  log(`Subscription success tx=${tx.hash}`);
};

document.querySelector("#register").onclick = async () => {
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
};

document.querySelector("#buyLicense").onclick = async () => {
  const trackId = Number(document.querySelector("#licenseTrackId").value);
  const contract = getPlatformContract(wallet.signer);
  const track = await contract.tracks(trackId);
  const tx = await contract.purchaseLicense(trackId, { value: track.licensePrice });
  await tx.wait();
  log(`License purchased tx=${tx.hash}`);
};

document.querySelector("#checkGate").onclick = async () => {
  const trackId = Number(document.querySelector("#gateTrackId").value);
  const contract = getPlatformContract(wallet.provider);
  const [allowed, track] = await Promise.all([
    contract.canDownload(wallet.address, trackId),
    contract.tracks(trackId)
  ]);

  log(`Download allowed=${allowed}`);
  if (allowed) window.open(track.audioUri, "_blank");
};

document.querySelector("#checkMerchant").onclick = async () => {
  const contract = getPlatformContract(wallet.provider);
  const status = await contract.isCommerciallyActive(wallet.address);
  log(`Merchant commercial status=${status}`);
};

document.querySelector("#viewCpm").onclick = async () => {
  const trackId = Number(document.querySelector("#cpmTrackId").value);
  const contract = getPlatformContract(wallet.provider);
  const reports = await contract.getCpmReports(trackId);
  log(`CPM reports: ${JSON.stringify(reports, null, 2)}`);
};

document.querySelector("#postCpm").onclick = async () => {
  const trackId = Number(document.querySelector("#cpmTrackId").value);
  const start = Number(document.querySelector("#cpmStart").value);
  const end = Number(document.querySelector("#cpmEnd").value);
  const cpm = Number(document.querySelector("#cpmValue").value);
  const notes = document.querySelector("#cpmNotes").value;
  const contract = getPlatformContract(wallet.signer);
  const tx = await contract.postCpmReport(trackId, start, end, cpm, notes);
  await tx.wait();
  log(`CPM posted tx=${tx.hash}`);
};
