import {
  type BundleDescription,
} from './utils/Types'
import { Environment } from './utils/Environment'
import { ResultsWriter } from './utils/ResultsWriter'
import { kernelLiteV23Baseline, simpleAccountV06Baseline } from './Cases'

const bundlesToRun: BundleDescription[] = [
  {
    name: 'single-simple-account-baseline',
    userOps: [simpleAccountV06Baseline]
  },
  {
    name: 'double-simple-account-baseline',
    userOps: [simpleAccountV06Baseline, simpleAccountV06Baseline]
  },
  {
    name: 'single-zerodev-kernel-lite-baseline',
    userOps: [kernelLiteV23Baseline]
  }
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
      resultsWriter.addResult(bundle.name, res.hash, bundle.userOps.length, parseInt(res.gasUsed.toString()))
    })
  }

  after(async function () {
    resultsWriter.writeResults()
  })
})
