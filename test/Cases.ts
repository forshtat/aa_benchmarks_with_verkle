import {
  type BundleDescription,
  CreationStrategy,
  GasPaymentStrategy,
  PaymasterType, UserOpAction,
  type UserOpDescription,
  WalletImplementation
} from './utils/Types'

export const simpleAccountV06Baseline: UserOpDescription = {
  walletImplementation: WalletImplementation.simpleAccount_v6,
  paymasterType: PaymasterType.noPaymaster,
  gasPaymentStrategy: GasPaymentStrategy.accountBalance,
  creationStrategy: CreationStrategy.usePreCreatedAccount,
  userOpAction: UserOpAction.valueTransfer
}

export const simpleAccountV06WithCreation: UserOpDescription = {
  ...simpleAccountV06Baseline,
  creationStrategy: CreationStrategy.useDeployerInUserOp
}

export const kernelLiteV23Baseline: UserOpDescription = {
  walletImplementation: WalletImplementation.zerodevKernelLite_v2_3,
  paymasterType: PaymasterType.noPaymaster,
  gasPaymentStrategy: GasPaymentStrategy.accountBalance,
  creationStrategy: CreationStrategy.usePreCreatedAccount,
  userOpAction: UserOpAction.valueTransfer
}

export const kernelLiteV23WithCreation: UserOpDescription = {
  ...kernelLiteV23Baseline,
  creationStrategy: CreationStrategy.useDeployerInUserOp
}

export const bundlesToRun: BundleDescription[] = [
  {
    name: 'single-simple-account-baseline',
    userOps: [simpleAccountV06Baseline]
  },
  {
    name: 'double-simple-account-baseline',
    userOps: [simpleAccountV06Baseline, simpleAccountV06Baseline]
  },
  {
    name: 'single-simple-account-with-creation',
    userOps: [simpleAccountV06WithCreation]
  },
  {
    name: 'single-zerodev-kernel-lite-baseline',
    userOps: [kernelLiteV23Baseline]
  },
  {
    name: 'single-zerodev-kernel-lite-with-creation',
    userOps: [kernelLiteV23WithCreation]
  }
]
