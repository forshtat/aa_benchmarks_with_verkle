import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import "hardhat-deploy"

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
  },
}

export default config
