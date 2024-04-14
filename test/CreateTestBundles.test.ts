import { Environment } from './utils/Environment'
import { ResultsWriter } from './utils/ResultsWriter'
import { bundlesToRun } from './Cases'

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
