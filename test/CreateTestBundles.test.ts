import { Environment } from './utils/Environment'
import { bundlesToRun } from './Cases'

describe('Creating Test Bundles', function () {
  let environment: Environment

  before(async function () {
    environment = new Environment()
    await environment.init()
  })

  for (const bundle of bundlesToRun) {
    it(`bundle: ${bundle.name} size: ${bundle.userOps.length}`, async function () {
      const res = await environment.handleOps(bundle.userOps)
      environment.resultsWriter.addResult(bundle.name, res.hash, bundle.userOps.length, parseInt(res.gasUsed.toString()))
    })
  }

  after(async function () {
    environment.resultsWriter.writeResults()
  })
})
