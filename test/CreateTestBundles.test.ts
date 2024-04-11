import { before } from 'mocha'

import {
  BundleDescription,
  CreationStrategy,
  GasPaymentStrategy,
  PaymasterType, UserOpAction,
  UserOpDescription,
  WalletImplementation
} from './utils/Types'
import { Environment } from './utils/Environment'

const simpleAccountV06Baseline: UserOpDescription = {
  walletImplementation: WalletImplementation.simpleAccount_v6,
  paymasterType: PaymasterType.noPaymaster,
  gasPaymentStrategy: GasPaymentStrategy.accountBalance,
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
    let environment: Environment

    before(async function () {
      environment = new Environment()
      await environment.init()
    })

    for (const bundle of bundlesToRun) {
      it(`bundle: ${bundle.name} size: ${bundle.userOps.length}`, async function () {
        await environment.handleOps(bundle.userOps)
      })
    }
  })
})
