import * as fs from 'node:fs'
import { type AddressLike, resolveAddress } from 'ethers'

interface RunResult {
  name: string
  txHash: string
  userOpsCount: number
  totalGasUsed: number
}

export class ResultsWriter {
  private readonly contracts = new Map<string, string>()
  private readonly results: RunResult[] = []

  addResult (name: string, txHash: string, userOpsCount: number, totalGasUsed: number): void {
    this.results.push({ name, txHash, userOpsCount, totalGasUsed })
  }

  async addContractName (addressLike: AddressLike, name: string): Promise<void> {
    const address = await resolveAddress(addressLike)
    this.contracts.set(address.toLowerCase(), name)
  }

  writeResults (): void {
    const contracts = Object.fromEntries(this.contracts.entries())
    fs.writeFileSync(
      'results.json',
      JSON.stringify({ results: this.results, contracts }, null, 2)
    )
  }
}
