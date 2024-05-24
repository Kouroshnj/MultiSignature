require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()

const { API_URL, PRIVATE_KEY, CHAIN_ID, API_KEY } = process.env

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },

    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 5777
    },

    sepolia: {
      url: API_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: parseInt(CHAIN_ID)
    },
  },
  etherscan: {
    apiKey: API_KEY
  },
  solidity: {
    compilers: [
      {
        version: "0.8.10"
      }
    ]
  }
};
