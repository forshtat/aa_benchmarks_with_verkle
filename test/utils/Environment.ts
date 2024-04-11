import * as crypto from 'node:crypto'
import { AddressLike, Signer, resolveAddress } from 'ethers'
import { UserOperationStruct } from '@account-abstraction/contracts'
import { ethers } from 'hardhat'

import { ResultsWriter } from './ResultsWriter'
import { GasPaymentStrategy, UserOpAction, UserOpDescription, WalletImplementation } from './Types'

import { ERC20__factory, SimpleAccount__factory, ERC20, EntryPoint, EntryPoint__factory } from '../../typechain-types'
import { getUserOpSignature } from './ERC4337'

export function randomAddress (): string {
  return `0x${crypto.randomBytes(20).toString('hex')}`
}

const PRIORITY_FEE = 1000000000n

export class Environment {
  signer!: Signer
  resultsWriter!: ResultsWriter
  beneficiary!: string
  chainId!: bigint

  entryPointV06!: EntryPoint
  entryPointV06Address!: string
  erc20Token!: ERC20

  async init () {
    this.beneficiary = randomAddress()
    this.resultsWriter = new ResultsWriter()
    this.chainId = (await ethers.provider.getNetwork()).chainId
    this.signer = await ethers.provider.getSigner()
    this.erc20Token = await new ERC20__factory(this.signer).deploy('Test Token', 'TEST')
    this.entryPointV06 = await new EntryPoint__factory(this.signer).deploy()
    this.entryPointV06Address = await resolveAddress(this.entryPointV06.target)
  }

  async handleOps (descriptions: UserOpDescription[]): Promise<void> {
    const userOps: UserOperationStruct[] = []
    for (const description of descriptions) {
      const userOp = await this.createUserOp(description)
      userOps.push(userOp)
    }
    // @ts-ignore - different hardhat versions, slightly incompatible types
    await this.entryPointV06.handleOps(userOps, this.beneficiary)
  }

  async createUserOp (description: UserOpDescription): Promise<UserOperationStruct> {
    const callData = await this.getCalldata(description)
    const sender = await this.getSender(description)
    const maxFeePerGas = await this.getMaxFeePerGas()
    const userOp: UserOperationStruct = {
      callData,
      callGasLimit: 1000000,
      initCode: '0x',
      maxFeePerGas,
      maxPriorityFeePerGas: PRIORITY_FEE,
      nonce: 0,
      paymasterAndData: '0x',
      preVerificationGas: 1000000,
      sender,
      signature: '0x',
      verificationGasLimit: 1000000
    }
    userOp.signature = await getUserOpSignature(
      userOp,
      this.entryPointV06Address,
      parseInt(this.chainId.toString()),
      this.signer
    )

    await this.prepareBalanceForGas(sender, description)
    return userOp
  }

  async getCalldata (description: UserOpDescription): Promise<string> {
    let innerCallData: string
    switch (description.userOpAction) {
      case UserOpAction.valueTransfer:
        innerCallData = '0x'
        break
      case UserOpAction.erc20Transfer:
        const randomDestination = randomAddress()
        innerCallData = this.erc20Token.interface.encodeFunctionData('transfer', [randomDestination, 1000])
        break
      default:
        throw new Error('unsupported user op action')
    }
    let callData
    switch (description.walletImplementation) {
      case WalletImplementation.simpleAccount_v6:
        callData = SimpleAccount__factory.createInterface().encodeFunctionData('execute', [this.erc20Token.target, 0, innerCallData])
        break
      default:
        throw new Error('unsupported wallet implementation')
    }
    return callData
  }

  async getSender (description: UserOpDescription): Promise<string> {
    switch (description.walletImplementation) {
      case WalletImplementation.simpleAccount_v6:
        // TODO: use deployer factory
        const wallet = await new SimpleAccount__factory(this.signer).deploy(this.entryPointV06.target)
        await wallet.initialize(this.signer.getAddress())
        return resolveAddress(wallet.target)
      default:
        throw new Error('unsupported wallet implementation')
    }
  }

  async getMaxFeePerGas () {
    const block = await ethers.provider.getBlock('latest')
    return block!.baseFeePerGas! + PRIORITY_FEE
  }

  private async prepareBalanceForGas (sender: string, description: UserOpDescription) {
    switch (description.gasPaymentStrategy) {
      case GasPaymentStrategy.accountBalance:
        await this.signer.sendTransaction({ to: sender, value: 1e18.toString() })
        break
      default:
        throw new Error('gas payment strategy not supported')
    }
  }
}
