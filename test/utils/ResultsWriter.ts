import * as fs from 'node:fs'

export interface RunResult {
  name: string
  txHash: string
}

export class ResultsWriter {
  private readonly results: RunResult[] = []

  addResult (result: RunResult) {
    this.results.push(result)
  }

  writeResults () {
    fs.writeFileSync('results.json', JSON.stringify(this.results))

  }
}
