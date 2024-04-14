import * as crypto from 'node:crypto'
import assert from 'node:assert'
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'hardhat'
import { type Signer, resolveAddress, AbiCoder, type ContractTransactionReceipt, type EventLog } from 'ethers'

import {
  CreationStrategy,
  GasPaymentStrategy,
  UserOpAction,
  type UserOpDescription,
  WalletImplementation
} from './Types'
import { getUserOpSignature } from './ERC4337'

import {
  ERC20__factory,
  EntryPoint__factory,
  IKernelAccountV23__factory,
  type IKernelFactoryV23,
  IKernelFactoryV23__factory,
  SimpleAccountFactory__factory,
  SimpleAccount__factory,
  type ERC20,
  type EntryPoint,
  type SimpleAccountFactory
} from '../../typechain-types'
import { type UserOperationStruct } from '../../typechain-types/@account-abstraction/contracts/core/EntryPoint'
import { Create2Factory } from './Create2Factory'

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
  zerodevKernelAccountFactoryV23!: IKernelFactoryV23
  zerodevKernelAccountImplementationV23!: string
  zerodevKernelECDSAValidatorV23!: string

  async init (): Promise<void> {
    this.signer = await ethers.provider.getSigner()
    await this.initEntryPoint()
    this.beneficiary = randomAddress()
    this.chainId = (await ethers.provider.getNetwork()).chainId
    this.erc20Token = await new ERC20__factory(this.signer).deploy('Test Token', 'TEST')
    await this.initAccountFactories()
  }

  async initEntryPoint (): Promise<void> {
    const create2factory = new Create2Factory(new StaticJsonRpcProvider('http://127.0.0.1:8545'))
    const epf = new EntryPoint__factory(this.signer)
    this.entryPointV06Address = await create2factory.deploy(epf.bytecode, 0, process.env.COVERAGE != null ? 20e6 : 8e6)
    this.entryPointV06 = EntryPoint__factory.connect(this.entryPointV06Address, this.signer)
  }

  async initAccountFactories (): Promise<void> {
    this.simpleAccountFactoryV06 = await new SimpleAccountFactory__factory(this.signer).deploy(this.entryPointV06Address)

    const zerodevKernelFactory: string = require('../../wallets/zerodev-kernel/deployments/localhost/KernelFactory.json').address
    this.zerodevKernelAccountImplementationV23 = require('../../wallets/zerodev-kernel/deployments/localhost/KernelLiteECDSA.json').address
    this.zerodevKernelECDSAValidatorV23 = require('../../wallets/zerodev-kernel/deployments/localhost/ECDSAValidator.json').address
    this.zerodevKernelAccountFactoryV23 = IKernelFactoryV23__factory.connect(zerodevKernelFactory, this.signer)
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

  async validateAllOpsSucceeded (receipt: ContractTransactionReceipt): Promise<void> {
    for (const log of receipt.logs) {
      const eventLog = log as EventLog
      if (eventLog.eventName === 'UserOperationEvent') {
        assert(eventLog.args.success, 'user operation success status is "false"')
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
    userOp.signature = await this.getSignature(userOp, description)

    await this.prepareBalanceForGas(sender, description)
    return userOp
  }

  async getSignature (
    userOp: UserOperationStruct,
    description: UserOpDescription
  ): Promise<string> {
    let signature = await getUserOpSignature(
      userOp,
      this.entryPointV06Address,
      parseInt(this.chainId.toString()),
      this.signer
    )
    if (description.walletImplementation === WalletImplementation.zerodevKernelLite_v2_3) {
      signature = '0x00000000' + signature.replace('0x', '')
    }
    return signature
  }

  async getCalldata (description: UserOpDescription): Promise<string> {
    let innerCallTarget: string
    let innerCallData: string
    let innerCallValue: string
    const randomDestination = randomAddress()

    switch (description.userOpAction) {
      case UserOpAction.valueTransfer:
        innerCallTarget = randomDestination
        innerCallData = '0x'
        innerCallValue = '100000'
        break
      case UserOpAction.erc20Transfer:
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
      case WalletImplementation.zerodevKernelLite_v2_3:
        callData = IKernelAccountV23__factory.createInterface().encodeFunctionData(
          'execute',
          [innerCallTarget, innerCallValue, innerCallData, 0]
        )
        break
      default:
        throw new Error('unsupported wallet implementation')
    }
    return callData
  }

  async getSender (description: UserOpDescription): Promise<string> {
    const accountOwner = await this.signer.getAddress()

    switch (description.creationStrategy) {
      case CreationStrategy.usePreCreatedAccount:
        break
      default:
        throw new Error('unsupported wallet creation strategy')
    }

    switch (description.walletImplementation) {
      case WalletImplementation.simpleAccount_v6: {
        this.globalFactorySalt++
        await this.simpleAccountFactoryV06.createAccount(
          accountOwner,
          this.globalFactorySalt
        )
        const getAddress = this.simpleAccountFactoryV06.interface.encodeFunctionData(
          'getAddress', [accountOwner, this.globalFactorySalt]
        )
        const ret = await ethers.provider.call({ to: this.simpleAccountFactoryV06.target, data: getAddress })
        return new AbiCoder().decode(['address'], ret)[0]
      }
      case WalletImplementation.zerodevKernelLite_v2_3: {
        this.globalFactorySalt++
        const initData = IKernelAccountV23__factory.createInterface().encodeFunctionData(
          'initialize', [this.zerodevKernelECDSAValidatorV23, accountOwner])
        await this.zerodevKernelAccountFactoryV23.createAccount(
          this.zerodevKernelAccountImplementationV23,
          initData,
          this.globalFactorySalt
        )
        return await this.zerodevKernelAccountFactoryV23.getAccountAddress(initData, this.globalFactorySalt)
      }
      default:
        throw new Error('unsupported wallet implementation')
    }
  }

  async getMaxFeePerGas (): Promise<bigint> {
    const block = await ethers.provider.getBlock('latest')
    return block!.baseFeePerGas! + PRIORITY_FEE
  }

  private async prepareBalanceForGas (sender: string, description: UserOpDescription): Promise<void> {
    switch (description.gasPaymentStrategy) {
      case GasPaymentStrategy.accountBalance:
        await this.signer.sendTransaction({ to: sender, value: 1e18.toString() })
        break
      default:
        throw new Error('gas payment strategy not supported')
    }
  }
}
