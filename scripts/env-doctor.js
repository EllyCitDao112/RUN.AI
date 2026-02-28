import fs from "fs";

const requiredEnv = ["PRIVATE_KEY", "BSC_TESTNET_RPC_URL", "VITE_PLATFORM_ADDRESS"];
const proxyEnv = [
  "http_proxy",
  "https_proxy",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "npm_config_http_proxy",
  "npm_config_https_proxy"
];

function loadDotEnv(path = ".env") {
  if (!fs.existsSync(path)) return {};
  const text = fs.readFileSync(path, "utf8");
  const vars = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    vars[key] = value;
  }
  return vars;
}

function mask(v = "") {
  if (v.length <= 10) return "***";
  return `${v.slice(0, 6)}...${v.slice(-4)}`;
}


function printManualWarningGuide() {
  console.log("\nManual guide to correct warning:");
  console.log("1) Create env file: cp .env.example .env");
  console.log("2) Fill required keys: PRIVATE_KEY, BSC_TESTNET_RPC_URL, VITE_PLATFORM_ADDRESS");
  console.log("3) Clear proxy vars for current shell:");
  console.log("   unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY npm_config_http_proxy npm_config_https_proxy");
  console.log("4) Clear npm proxy config:");
  console.log("   npm config delete proxy && npm config delete https-proxy");
  console.log("5) Re-run diagnostics: npm run env:doctor");
  console.log("6) Install dependencies: npm i");
}

const dotEnv = loadDotEnv();
let hasError = false;

console.log("[env-doctor] Checking required .env keys...");
for (const key of requiredEnv) {
  const value = dotEnv[key] || process.env[key];
  if (!value) {
    console.log(`❌ Missing ${key}`);
    hasError = true;
  } else {
    console.log(`✅ ${key}=${mask(value)}`);
  }
}

console.log("\n[env-doctor] Checking proxy variables that often break npm in restricted environments...");
const presentProxyVars = proxyEnv.filter((k) => process.env[k]);
if (presentProxyVars.length === 0) {
  console.log("✅ No proxy env vars detected");
} else {
  console.log(`⚠️ Detected proxy vars: ${presentProxyVars.join(", ")}`);
  console.log("   If npm install fails with 403, run: npm run setup:local");
  printManualWarningGuide();
}

if (hasError) {
  console.log("\nFix: cp .env.example .env and fill required values.");
  printManualWarningGuide();
  process.exitCode = 1;
}
