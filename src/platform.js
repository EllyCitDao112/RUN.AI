import { ethers } from "ethers";

export const PLATFORM_ABI = [
  "function subscribe(uint8 role,uint8 tier,uint64 durationDays) payable",
  "function subscriptionPricePerDay(bytes32 key) view returns (uint256)",
  "function registerTrack(string title,string metadataUri,string coverUri,string audioUri,uint256 licensePrice) returns (uint256)",
  "function purchaseLicense(uint256 trackId) payable returns (uint256)",
  "function tracks(uint256 trackId) view returns (address artist,string title,string metadataUri,string coverUri,string audioUri,uint256 licensePrice,uint64 createdAt)",
  "function canDownload(address account,uint256 trackId) view returns (bool)",
  "function isCommerciallyActive(address account) view returns (bool)",
  "function getCpmReports(uint256 trackId) view returns ((uint64 periodStart,uint64 periodEnd,uint256 cpm,string notes,uint64 postedAt,address poster)[] memory)",
  "function postCpmReport(uint256 trackId,uint64 periodStart,uint64 periodEnd,uint256 cpm,string notes)",
  "event TrackRegistered(uint256 indexed trackId,address indexed artist,string title,uint256 licensePrice,string metadataUri)"
];

export const ROLES = { Artist: 1, User: 2, Merchant: 3 };

export async function connectWallet() {
  if (!window.ethereum) throw new Error("No injected wallet found.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

export function getPlatformContract(signerOrProvider) {
  const address = import.meta.env.VITE_PLATFORM_ADDRESS;
  if (!address) throw new Error("Missing VITE_PLATFORM_ADDRESS");
  return new ethers.Contract(address, PLATFORM_ABI, signerOrProvider);
}

export function priceKey(role, tier) {
  return ethers.keccak256(ethers.solidityPacked(["uint8", "uint8"], [role, tier]));
}
