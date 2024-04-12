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
import { ResultsWriter } from './utils/ResultsWriter'
import assert from 'node:assert'

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
  let environment: Environment
  let resultsWriter: ResultsWriter

  before(async function () {
    resultsWriter = new ResultsWriter()
    environment = new Environment()
    await environment.init()
  })

  for (const bundle of bundlesToRun) {
    it(`bundle: ${bundle.name} size: ${bundle.userOps.length}`, async function () {
      const res = await environment.handleOps(bundle.userOps)
      resultsWriter.addResult(bundle.name, res.hash, bundle.userOps.length, parseInt(receipt.gasUsed.toString()))
    })
  }

  after(async function () {
    resultsWriter.writeResults()
  })
})
