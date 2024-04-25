require("@nomicfoundation/hardhat-toolbox");

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
    }
  },
  solidity: "0.8.24",
};
