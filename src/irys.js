import { WebIrys } from "@irys/sdk";

const MAX_MEDIA_SIZE_BYTES = 100 * 1024 * 1024;
let irys;

export async function getIrys(provider) {
  if (!irys) {
    irys = new WebIrys({
      network: "devnet",
      token: "bnb",
      wallet: { name: "ethersv6", provider }
    });
    await irys.ready();
  }
  return irys;
}

function normalizeMime(file, fallback = "application/octet-stream") {
  return file?.type && file.type.trim().length > 0 ? file.type : fallback;
}

function validateFile(file, allowedPrefixes) {
  if (!file) throw new Error("Missing media file");
  if (file.size <= 0) throw new Error(`File ${file.name} is empty`);
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(`File ${file.name} exceeds ${MAX_MEDIA_SIZE_BYTES / (1024 * 1024)}MB limit`);
  }

  const mime = normalizeMime(file);
  if (!allowedPrefixes.some((prefix) => mime.startsWith(prefix))) {
    throw new Error(`Unsupported media type ${mime} for ${file.name}`);
  }

  return mime;
}

export async function uploadMedia(provider, file, allowedPrefixes = ["image/", "audio/", "video/"]) {
  const mime = validateFile(file, allowedPrefixes);
  const client = await getIrys(provider);
  const data = new Uint8Array(await file.arrayBuffer());

  const tx = await client.upload(data, {
    tags: [
      { name: "Content-Type", value: mime },
      { name: "File-Name", value: file.name || "media.bin" }
    ]
  });

  return {
    uri: `https://gateway.irys.xyz/${tx.id}`,
    mime,
    size: file.size,
    id: tx.id
  };
}

export async function uploadJson(provider, data) {
  const client = await getIrys(provider);
  const tx = await client.upload(JSON.stringify(data), {
    tags: [{ name: "Content-Type", value: "application/json" }]
  });
  return `https://gateway.irys.xyz/${tx.id}`;
}
