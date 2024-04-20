import * as crypto from 'node:crypto'
import assert from 'node:assert'
import { AbiCoder, type ContractTransactionReceipt, type EventLog, getBytes, resolveAddress, type Signer } from 'ethers'
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'hardhat'

import {
  CreationStrategy,
  GasPaymentStrategy, PaymasterType,
  UserOpAction,
  type UserOpDescription,
  WalletImplementation
} from './Types'
import { getUserOpSignature } from './ERC4337'

import {
  EntryPoint__factory,
  IKernelAccountV23__factory,
  IKernelFactoryV23__factory,
  SimpleAccountFactory__factory,
  SimpleAccount__factory,
  TestERC20__factory,
  VerifyingPaymaster__factory,
  type EntryPoint,
  type IKernelFactoryV23,
  type SimpleAccountFactory,
  type TestERC20,
  type VerifyingPaymaster
} from '../../typechain-types'
import { type UserOperationStruct } from '../../typechain-types/@account-abstraction/contracts/core/EntryPoint'
import { Create2Factory } from './Create2Factory'
import { ResultsWriter } from './ResultsWriter'

export function randomAddress (): string {
  return `0x${crypto.randomBytes(20).toString('hex')}`
}

const PRIORITY_FEE = '1000000000'

export class Environment {
  resultsWriter: ResultsWriter = new ResultsWriter()

  signer!: Signer
  // resultsWriter!: ResultsWriter
  beneficiary!: string
  chainId!: bigint
  globalFactorySalt: number = 0

  entryPointV06!: EntryPoint
  entryPointV06Address!: string
  erc20Token!: TestERC20

  simpleAccountFactoryV06!: SimpleAccountFactory
  zerodevKernelAccountFactoryV23!: IKernelFactoryV23
  zerodevKernelAccountImplementationV23!: string
  zerodevKernelECDSAValidatorV23!: string

  verifyingPaymaster!: VerifyingPaymaster

  async init (): Promise<void> {
    this.signer = await ethers.provider.getSigner()
    await this.initEntryPoint()
    await this.initPaymaster()
    this.beneficiary = randomAddress()
    await this.signer.sendTransaction({ to: this.beneficiary, value: 1 })

    this.chainId = (await ethers.provider.getNetwork()).chainId
    this.erc20Token = await new TestERC20__factory(this.signer).deploy('TestERC20', 'TEST')
    await this.resultsWriter.addContractName(this.erc20Token.target, 'TestERC20')
    await this.initAccountFactories()
  }

  async initEntryPoint (): Promise<void> {
    const create2factory = new Create2Factory(new StaticJsonRpcProvider('http://127.0.0.1:8545'))
    const epf = new EntryPoint__factory(this.signer)
    // const epf = require('@account-abstraction/contracts/artifacts/EntryPoint.json')
    this.entryPointV06Address = await create2factory.deploy(epf.bytecode, 0, process.env.COVERAGE != null ? 20e6 : 8e6)
    await this.resultsWriter.addContractName(this.entryPointV06Address, 'EntryPoint v0.6')
    // hard-coded address is not very reliable but SenderCreator is privant in EntryPoint
    await this.resultsWriter.addContractName('0x32d573eee83015ea153d985d454144937361fdab', 'E.P. SenderCreator v0.6')
    this.entryPointV06 = EntryPoint__factory.connect(this.entryPointV06Address, this.signer)
  }

  async initPaymaster (): Promise<void> {
    const accountOwner = await this.signer.getAddress()

    this.verifyingPaymaster = await new VerifyingPaymaster__factory(this.signer)
      .deploy(this.entryPointV06Address, accountOwner)
    await this.resultsWriter.addContractName(this.verifyingPaymaster.target, 'VerifyingPaymaster')
    await this.verifyingPaymaster.deposit({ value: 1e18.toString() })
  }

  async initAccountFactories (): Promise<void> {
    this.simpleAccountFactoryV06 = await new SimpleAccountFactory__factory(this.signer).deploy(this.entryPointV06Address)
    const implementation = await this.simpleAccountFactoryV06.accountImplementation()
    await this.resultsWriter.addContractName(this.simpleAccountFactoryV06.target, 'SimpleAccountFactory')
    await this.resultsWriter.addContractName(implementation, 'SimpleAccountImplementation')

    const zerodevKernelFactory: string = require('../../wallets/zerodev-kernel/deployments/localhost/KernelFactory.json').address
    this.zerodevKernelAccountImplementationV23 = require('../../wallets/zerodev-kernel/deployments/localhost/KernelLiteECDSA.json').address
    this.zerodevKernelECDSAValidatorV23 = require('../../wallets/zerodev-kernel/deployments/localhost/ECDSAValidator.json').address
    await this.resultsWriter.addContractName(zerodevKernelFactory, 'KernelFactory v2.3')
    await this.resultsWriter.addContractName(this.zerodevKernelAccountImplementationV23, 'KernelAccountImplementation v2.3')
    await this.resultsWriter.addContractName(this.zerodevKernelECDSAValidatorV23, 'KernelECDSAValidator v2.3')

    this.zerodevKernelAccountFactoryV23 = IKernelFactoryV23__factory.connect(zerodevKernelFactory, this.signer)
  }

  async handleOps (
    descriptions: UserOpDescription[],
    reuseAccounts?: number[]
  ): Promise<ContractTransactionReceipt> {
    const userOps: UserOperationStruct[] = []
    for (const [index, description] of descriptions.entries()) {
      let reusedSender
      if (reuseAccounts != null) {
        const indexToReuse = reuseAccounts[index]
        if (indexToReuse != null && indexToReuse < userOps.length) {
          reusedSender = await resolveAddress(userOps[indexToReuse].sender)
        }
      }
      const userOp = await this.createUserOp(description, reusedSender)
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

  async createUserOp (description: UserOpDescription, reusedSender?: string): Promise<UserOperationStruct> {
    const { sender, salt } = await this.getSender(description, reusedSender)
    const callData = await this.getCalldata(description, sender)
    const initCode = await this.getInitCode(description, salt)
    const maxFeePerGas = await this.getMaxFeePerGas()
    const nonce = await this.getNonce(sender, reusedSender)
    const userOp: UserOperationStruct = {
      callData,
      callGasLimit: 1000000,
      initCode,
      maxFeePerGas,
      maxPriorityFeePerGas: PRIORITY_FEE,
      nonce,
      paymasterAndData: '0x',
      preVerificationGas: 1000000,
      sender,
      signature: '0x',
      verificationGasLimit: 1000000
    }
    userOp.paymasterAndData = await this.getPaymasterAndData(userOp, description)
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

  async getCalldata (description: UserOpDescription, sender: string): Promise<string> {
    let innerCallTarget: string
    let innerCallData: string
    let innerCallValue: string
    const randomDestination = randomAddress()

    // Initialize destination address to avoid 25000 gas charge
    await this.signer.sendTransaction({ to: randomDestination, value: 1 })

    switch (description.userOpAction) {
      case UserOpAction.valueTransfer:
        innerCallTarget = randomDestination
        innerCallData = '0x'
        innerCallValue = '100000'
        break
      case UserOpAction.erc20Transfer:
        await this.erc20Token.mint(sender, 10000)
        await this.erc20Token.mint(randomDestination, 1)
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

  async getPaymasterAndData (
    userOp: UserOperationStruct,
    description: UserOpDescription
  ): Promise<string> {
    switch (description.paymasterType) {
      case PaymasterType.noPaymaster:
        return '0x'
      case PaymasterType.verifyingPaymaster: {
        const MOCK_VALID_UNTIL = '0x00000000deadbeef'
        const MOCK_VALID_AFTER = '0x0000000000001234'
        // the VerifyingPaymaster::getHash function is affected by placeholder paymaster data length
        userOp.paymasterAndData = '0x' + 'ff'.repeat(148)
        const hash = await this.verifyingPaymaster.getHash(userOp, MOCK_VALID_UNTIL, MOCK_VALID_AFTER)
        const hashBuffer = getBytes(hash)
        const sig = await this.signer.signMessage(hashBuffer)
        const paymasterAddress = await resolveAddress(this.verifyingPaymaster.target)
        const validityTimeRange = new AbiCoder().encode(['uint48', 'uint48'], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]).replace('0x', '')
        return paymasterAddress +
          validityTimeRange +
          sig.replace('0x', '')
      }
      default:
        throw new Error('unsupported paymaster')
    }
  }

  async getInitCode (description: UserOpDescription, salt: number): Promise<string> {
    const accountOwner = await this.signer.getAddress()

    if (description.creationStrategy === CreationStrategy.usePreCreatedAccount) {
      return '0x'
    }

    switch (description.walletImplementation) {
      case WalletImplementation.simpleAccount_v6: {
        const functionData = this
          .simpleAccountFactoryV06
          .interface
          .encodeFunctionData(
            'createAccount', [accountOwner, salt]
          )
        const factoryAddress = await resolveAddress(this.simpleAccountFactoryV06.target)
        return factoryAddress + functionData.replace('0x', '')
      }
      case WalletImplementation.zerodevKernelLite_v2_3: {
        const initData = IKernelAccountV23__factory.createInterface().encodeFunctionData(
          'initialize', [this.zerodevKernelECDSAValidatorV23, accountOwner])
        const functionData =
          this
            .zerodevKernelAccountFactoryV23
            .interface
            .encodeFunctionData('createAccount', [
              this.zerodevKernelAccountImplementationV23, initData, salt
            ])
        const factoryAddress = await resolveAddress(this.zerodevKernelAccountFactoryV23.target)
        return factoryAddress + functionData.replace('0x', '')
      }
      default:
        throw new Error('unsupported wallet implementation')
    }
  }

  async getSender (description: UserOpDescription, reusedSender?: string): Promise<{
    sender: string
    salt: number
  }> {
    if (reusedSender != null) {
      if (description.creationStrategy !== CreationStrategy.usePreCreatedAccount) {
        throw new Error('impossible combination of "usePreCreatedAccount" and "reusedSender" test case parameters')
      }
      return {
        sender: reusedSender,
        salt: 0
      }
    }
    const accountOwner = await this.signer.getAddress()

    let sender: string
    switch (description.walletImplementation) {
      case WalletImplementation.simpleAccount_v6: {
        this.globalFactorySalt++

        const getAddress = this.simpleAccountFactoryV06.interface.encodeFunctionData(
          'getAddress', [accountOwner, this.globalFactorySalt]
        )
        const ret = await ethers.provider.call({ to: this.simpleAccountFactoryV06.target, data: getAddress })
        sender = new AbiCoder().decode(['address'], ret)[0]
        await this.resultsWriter.addContractName(sender, 'ERC1967Proxy')

        if (description.creationStrategy === CreationStrategy.usePreCreatedAccount) {
          await this.simpleAccountFactoryV06.createAccount(
            accountOwner,
            this.globalFactorySalt
          )
          await this.initializeNonce(description, sender)
        }
      }
        break
      case WalletImplementation.zerodevKernelLite_v2_3: {
        this.globalFactorySalt++
        const initData = IKernelAccountV23__factory.createInterface().encodeFunctionData(
          'initialize', [this.zerodevKernelECDSAValidatorV23, accountOwner])

        sender = await this.zerodevKernelAccountFactoryV23.getAccountAddress(initData, this.globalFactorySalt)
        await this.resultsWriter.addContractName(sender, 'KernelLite v2.3')

        if (description.creationStrategy === CreationStrategy.usePreCreatedAccount) {
          await this.zerodevKernelAccountFactoryV23.createAccount(
            this.zerodevKernelAccountImplementationV23,
            initData,
            this.globalFactorySalt
          )
          await this.initializeNonce(description, sender)
        }
      }
        break
      default:
        throw new Error('unsupported wallet implementation')
    }
    return {
      sender,
      salt: this.globalFactorySalt
    }
  }

  async getMaxFeePerGas (): Promise<bigint> {
    const block = await ethers.provider.getBlock('latest')
    return block!.baseFeePerGas! + BigInt(PRIORITY_FEE)
  }

  private async prepareBalanceForGas (sender: string, description: UserOpDescription): Promise<void> {
    switch (description.gasPaymentStrategy) {
      case GasPaymentStrategy.accountBalance:
        await this.signer.sendTransaction({ to: sender, value: 1e18.toString() })
        break
      case GasPaymentStrategy.accountDeposit:
        await this.signer.sendTransaction({ to: sender, value: 100000 })
        await this.entryPointV06.depositTo(sender, { value: 1e18.toString() })
        break
      default:
        throw new Error('gas payment strategy not supported')
    }
  }

  /**
   * Initializing the `nonceSequenceNumber[msg.sender][key]` value in `NonceManager` to avoid rare 20000 gas SSTORE.
   */
  async initializeNonce (description: UserOpDescription, accountAddress: string): Promise<void> {
    const nonceBefore = await this.getNonce(accountAddress)
    if (nonceBefore !== 0n) {
      return
    }
    const incrementNonceData =
      this.entryPointV06.interface.encodeFunctionData('incrementNonce', [0])

    switch (description.walletImplementation) {
      case WalletImplementation.simpleAccount_v6: {
        const account = SimpleAccount__factory.connect(accountAddress, this.signer)
        await account.execute(this.entryPointV06.target, 0, incrementNonceData)
        break
      }
      case WalletImplementation.zerodevKernelLite_v2_3: {
        const account = IKernelAccountV23__factory.connect(accountAddress, this.signer)
        await account.execute(this.entryPointV06.target, 0, incrementNonceData, 0)
        break
      }
      default:
        throw new Error('unsupported wallet implementation')
    }

    const nonceAfter = await this.getNonce(accountAddress)
    assert(nonceAfter === 1n, `failed to increment account nonce ${accountAddress}}`)
  }

  accountReuseNonces: Record<string, bigint> = {}

  async getNonce (accountAddress: string, reusedSender?: string): Promise<bigint> {
    const currentNonce = await this.entryPointV06.getNonce(accountAddress, 0)
    if (reusedSender != null) {
      if (this.accountReuseNonces[reusedSender] == null) {
        this.accountReuseNonces[reusedSender] = currentNonce
      }
      return ++this.accountReuseNonces[reusedSender]
    }
    return currentNonce
  }
}
