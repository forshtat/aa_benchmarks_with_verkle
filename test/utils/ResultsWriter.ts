import * as fs from 'node:fs'

interface RunResult {
  name: string
  txHash: string
  userOpsCount: number
  totalGasUsed: number
}

export class ResultsWriter {
  private readonly results: RunResult[] = []

  addResult (name: string, txHash: string, userOpsCount: number, totalGasUsed: number) {
    this.results.push({ name, txHash, userOpsCount, totalGasUsed })
  }

  writeResults () {
    fs.writeFileSync('results.json', JSON.stringify(this.results, null, 2))

  }
}
