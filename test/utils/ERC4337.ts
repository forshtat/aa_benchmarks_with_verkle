import { AbiCoder, getBytes, keccak256, type Signer } from 'ethers'

import {
  type UserOperationStruct as UserOperation
} from '../../typechain-types/@account-abstraction/contracts/core/BaseAccount'

const defaultAbiCoder = new AbiCoder()

export function packUserOp (op: UserOperation, forSignature = true): string {
  if (forSignature) {
    return defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes32', 'bytes32',
        'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
        'bytes32'],
      [op.sender, op.nonce, keccak256(op.initCode), keccak256(op.callData),
        op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
        keccak256(op.paymasterAndData)])
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes', 'bytes',
        'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
        'bytes', 'bytes'],
      [op.sender, op.nonce, op.initCode, op.callData,
        op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
        op.paymasterAndData, op.signature])
  }
}

export function getUserOpHash (op: UserOperation, entryPoint: string, chainId: number): string {
  const userOpHash = keccak256(packUserOp(op, true))
  const enc = defaultAbiCoder.encode(
    ['bytes32', 'address', 'uint256'],
    [userOpHash, entryPoint, chainId])
  return keccak256(enc)
}

export async function getUserOpSignature (
  op: UserOperation,
  entryPoint: string,
  chainId: number,
  signer: Signer
): Promise<string> {
  const message = getBytes(getUserOpHash(op, entryPoint, chainId))
  return await signer.signMessage(message)
}
