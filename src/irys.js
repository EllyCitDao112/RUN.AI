import { WebIrys } from "@irys/sdk";

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

export async function uploadFile(provider, file) {
  const client = await getIrys(provider);
  const tx = await client.uploadFile(file);
  return `https://gateway.irys.xyz/${tx.id}`;
}

export async function uploadJson(provider, data) {
  const client = await getIrys(provider);
  const tx = await client.upload(JSON.stringify(data), {
    tags: [{ name: "Content-Type", value: "application/json" }]
  });
  return `https://gateway.irys.xyz/${tx.id}`;
}
