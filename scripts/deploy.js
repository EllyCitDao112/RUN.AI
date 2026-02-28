import "dotenv/config";
import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer configured. Set PRIVATE_KEY in .env.");
  }

  console.log("Deploying with:", deployer.address);
  const platform = await ethers.deployContract("MusicPilotPlatform", [deployer.address]);
  await platform.waitForDeployment();

  const address = await platform.getAddress();
  console.log("MusicPilotPlatform deployed:", address);

  const seedPrices = [
    [1, 1, ethers.parseEther("0.0001")],
    [2, 1, ethers.parseEther("0.00005")],
    [3, 1, ethers.parseEther("0.0002")]
  ];

  for (const [role, tier, price] of seedPrices) {
    const tx = await platform.setSubscriptionPricePerDay(role, tier, price);
    await tx.wait();
    console.log(`Set role=${role} tier=${tier} daily=${price.toString()}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
