// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
import { time } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import hre from 'hardhat'

export interface ERC4337v06Fixture {
  entryPointV06: any
}

export async function deployERC4337v06Fixture (): Promise<ERC4337v06Fixture> {
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60
  const ONE_GWEI = 1_000_000_000

  const lockedAmount = ONE_GWEI
  const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS

  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await hre.ethers.getSigners()

  const Lock = await hre.ethers.getContractFactory('Lock')
  const lock = await Lock.deploy(unlockTime, { value: lockedAmount })

  return { entryPointV06: 'present' }
}
