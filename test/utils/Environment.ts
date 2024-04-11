import { UserOperationStruct } from '@account-abstraction/contracts'
import * as crypto from 'node:crypto'
import { ethers } from 'hardhat'

import { UserOpAction, UserOpDescription, WalletImplementation } from './Types'
import { ERC20__factory, SimpleAccount__factory, ERC20, EntryPoint, EntryPoint__factory } from '../../typechain-types'

export class Environment {
  entryPointV06!: EntryPoint
  erc20Token!: ERC20

  async init () {
    const signer = await ethers.provider.getSigner()
    this.erc20Token = await new ERC20__factory(signer).deploy('Test Token', 'TEST')
    this.entryPointV06 = await new EntryPoint__factory(signer).deploy()
  }

  createUserOp (description: UserOpDescription): UserOperationStruct {
    const callData = this.getCalldata(description)
    return {
      callData,
      callGasLimit: 0,
      initCode: '0x',
      maxFeePerGas: 0,
      maxPriorityFeePerGas: 0,
      nonce: 0,
      paymasterAndData: '0x',
      preVerificationGas: 0,
      sender: '',
      signature: '0x',
      verificationGasLimit: 0
    }
  }

  getCalldata (description: UserOpDescription): string {
    let innerCallData: string
    switch (description.userOpAction) {
      case UserOpAction.erc20Transfer:
        const randomDestination = `0x${crypto.randomBytes(20).toString('hex')}`
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
}
