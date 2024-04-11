import { before } from 'mocha'
import { expect } from 'chai'
import { loadFixture, } from '@nomicfoundation/hardhat-toolbox/network-helpers'

import { deployERC4337v06Fixture } from './utils/ERC4337v06Fixture'
import {
  BundleDescription,
  CreationStrategy,
  GasPaymentStrategy,
  PaymasterType, UserOpAction,
  UserOpDescription,
  WalletImplementation
} from './utils/Types'

const simpleAccountV06Baseline: UserOpDescription = {
  walletImplementation: WalletImplementation.simpleAccount_v6,
  paymasterType: PaymasterType.noPaymaster,
  gasPaymentStrategy: GasPaymentStrategy.accountDeposit,
  creationStrategy: CreationStrategy.usePreCreatedAccount,
  userOpAction: UserOpAction.valueTransfer
}

const bundlesToRun: BundleDescription[] = [
  {
    name: 'single-simple-account-baseline',
    userOps: [simpleAccountV06Baseline]
  },
  {
    name: 'double-simple-account-baseline',
    userOps: [simpleAccountV06Baseline, simpleAccountV06Baseline]
  },
]

describe('Creating Test Bundles', function () {
  describe('ERC-4337 v0.6', function () {
    let entryPointV06: any

    before('Should set the right unlockTime', async function () {
      ({ entryPointV06 } = await loadFixture(deployERC4337v06Fixture))
    })

    for (const bundle of bundlesToRun) {
      it(`bundle: ${bundle.name} size: ${bundle.userOps.length}`, async function () {
        expect(entryPointV06).to.equal('whatever')
      })
    }
  })
})
