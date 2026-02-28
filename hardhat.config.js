import "dotenv/config";
import "@nomicfoundation/hardhat-ethers";

const { BSC_TESTNET_RPC_URL, PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    hardhat: {},
    bscTestnet: {
      url: BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};
