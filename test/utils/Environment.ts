import * as crypto from 'node:crypto'
import assert from 'node:assert'
import { Signer, resolveAddress, AbiCoder, ContractTransactionReceipt, EventLog } from 'ethers'
import { ethers } from 'hardhat'

import { GasPaymentStrategy, UserOpAction, UserOpDescription, WalletImplementation } from './Types'
import { getUserOpSignature } from './ERC4337'

import {
  ERC20__factory,
  SimpleAccount__factory,
  ERC20,
  EntryPoint,
  EntryPoint__factory,
  SimpleAccountFactory, SimpleAccountFactory__factory
} from '../../typechain-types'
import { UserOperationStruct } from '../../typechain-types/@account-abstraction/contracts/core/EntryPoint'

export function randomAddress (): string {
  return `0x${crypto.randomBytes(20).toString('hex')}`
}

const PRIORITY_FEE = 1000000000n

export class Environment {
  signer!: Signer
  // resultsWriter!: ResultsWriter
  beneficiary!: string
  chainId!: bigint
  globalFactorySalt: number = 0

  entryPointV06!: EntryPoint
  entryPointV06Address!: string
  erc20Token!: ERC20

  simpleAccountFactoryV06!: SimpleAccountFactory

  async init () {
    this.beneficiary = randomAddress()
    this.chainId = (await ethers.provider.getNetwork()).chainId
    this.signer = await ethers.provider.getSigner()
    this.erc20Token = await new ERC20__factory(this.signer).deploy('Test Token', 'TEST')
    this.entryPointV06 = await new EntryPoint__factory(this.signer).deploy()
    this.entryPointV06Address = await resolveAddress(this.entryPointV06.target)
    await this.initAccountFactories()
  }

  async initAccountFactories (): Promise<void> {
    this.simpleAccountFactoryV06 = await new SimpleAccountFactory__factory(this.signer).deploy(this.entryPointV06Address)
  }

  async handleOps (descriptions: UserOpDescription[]): Promise<ContractTransactionReceipt> {
    const userOps: UserOperationStruct[] = []
    for (const description of descriptions) {
      const userOp = await this.createUserOp(description)
      userOps.push(userOp)
    }
    const response = await this.entryPointV06.handleOps(userOps, this.beneficiary)
    const receipt = await response.wait()
    assert(receipt != null, 'receipt is null')
    await this.validateAllOpsSucceeded(receipt)
    return receipt
  }

  async validateAllOpsSucceeded (receipt: ContractTransactionReceipt) {
    for (const log of receipt.logs) {
      const eventLog = log as EventLog
      if (eventLog.eventName == 'UserOperationEvent') {
        assert(eventLog.args['success'], 'user operation success status is "false"')
      }
    }

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
    let innerCallTarget: string
    let innerCallData: string
    let innerCallValue: string
    switch (description.userOpAction) {
      case UserOpAction.valueTransfer:
        innerCallTarget = randomAddress()
        innerCallData = '0x'
        innerCallValue = '100000'
        break
      case UserOpAction.erc20Transfer:
        const randomDestination = randomAddress()
        innerCallTarget = await resolveAddress(this.erc20Token.target)
        innerCallData = this.erc20Token.interface.encodeFunctionData('transfer', [randomDestination, 1000])
        innerCallValue = '0'
        break
      default:
        throw new Error('unsupported user op action')
    }
    let callData
    switch (description.walletImplementation) {
      case WalletImplementation.simpleAccount_v6:
        callData = SimpleAccount__factory.createInterface().encodeFunctionData(
          'execute', [innerCallTarget, innerCallValue, innerCallData]
        )
        break
      default:
        throw new Error('unsupported wallet implementation')
    }
    return callData
  }

  async getSender (description: UserOpDescription): Promise<string> {
    switch (description.walletImplementation) {
      case WalletImplementation.simpleAccount_v6:
        const accountOwner = await this.signer.getAddress()
        await this.simpleAccountFactoryV06.createAccount(accountOwner, this.globalFactorySalt)
        const getAddress = this.simpleAccountFactoryV06.interface.encodeFunctionData(
          'getAddress', [accountOwner, this.globalFactorySalt]
        )
        this.globalFactorySalt++
        const ret = await ethers.provider.call({ to: this.simpleAccountFactoryV06.target, data: getAddress })
        return new AbiCoder().decode(['address'], ret)[0]
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
