import {
  CreationStrategy,
  GasPaymentStrategy,
  PaymasterType,
  UserOpAction,
  WalletImplementation,
  type BundleDescription,
  type UserOpDescription
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

export const simpleAccountV06VerifyingPaymaster: UserOpDescription = {
  ...simpleAccountV06Baseline,
  paymasterType: PaymasterType.verifyingPaymaster
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

export const kernelLiteV23VerifyingPaymaster: UserOpDescription = {
  ...kernelLiteV23Baseline,
  paymasterType: PaymasterType.verifyingPaymaster
}

export const simpleAccountV06ERC20Transfer: UserOpDescription = {
  ...simpleAccountV06Baseline,
  userOpAction: UserOpAction.erc20Transfer
}

export const kernelLiteV23ERC20Transfer: UserOpDescription = {
  ...kernelLiteV23Baseline,
  userOpAction: UserOpAction.erc20Transfer
}

export const simpleAccountV06WithCreationAndVerifyingPaymaster: UserOpDescription = {
  ...simpleAccountV06Baseline,
  creationStrategy: CreationStrategy.useDeployerInUserOp,
  paymasterType: PaymasterType.verifyingPaymaster
}

export const kernelLiteV23WithCreationAndVerifyingPaymaster: UserOpDescription = {
  ...kernelLiteV23Baseline,
  creationStrategy: CreationStrategy.useDeployerInUserOp,
  paymasterType: PaymasterType.verifyingPaymaster
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
    name: 'double-simple-account-with-creation',
    userOps: [simpleAccountV06WithCreation, simpleAccountV06WithCreation]
  },
  {
    name: 'single-simple-account-verifying-paymaster',
    userOps: [simpleAccountV06VerifyingPaymaster]
  },
  {
    name: 'double-simple-account-verifying-paymaster',
    userOps: [simpleAccountV06VerifyingPaymaster, simpleAccountV06VerifyingPaymaster]
  },
  {
    name: 'single-zerodev-kernel-lite-baseline',
    userOps: [kernelLiteV23Baseline]
  },
  {
    name: 'double-zerodev-kernel-lite-baseline',
    userOps: [kernelLiteV23Baseline, kernelLiteV23Baseline]
  },
  {
    name: 'single-zerodev-kernel-lite-with-creation',
    userOps: [kernelLiteV23WithCreation]
  },
  {
    name: 'double-zerodev-kernel-lite-with-creation',
    userOps: [kernelLiteV23WithCreation, kernelLiteV23WithCreation]
  },
  {
    name: 'single-zerodev-kernel-lite-verifying-paymaster',
    userOps: [kernelLiteV23VerifyingPaymaster]
  },
  {
    name: 'double-zerodev-kernel-lite-verifying-paymaster',
    userOps: [kernelLiteV23VerifyingPaymaster, kernelLiteV23VerifyingPaymaster]
  },
  {
    name: 'single-simple-account-erc20-transfer',
    userOps: [simpleAccountV06ERC20Transfer]
  },
  {
    name: 'double-simple-account-erc20-transfer',
    userOps: [simpleAccountV06ERC20Transfer, simpleAccountV06ERC20Transfer]
  },
  {
    name: 'single-zerodev-kernel-lite-erc20-transfer',
    userOps: [kernelLiteV23ERC20Transfer]
  },
  {
    name: 'double-zerodev-kernel-lite-erc20-transfer',
    userOps: [kernelLiteV23ERC20Transfer, kernelLiteV23ERC20Transfer]
  },

  {
    name: 'single-simple-account-lite-with-creation-and-paymaster',
    userOps: [simpleAccountV06WithCreationAndVerifyingPaymaster]
  },
  {
    name: 'double-simple-account-lite-with-creation-and-paymaster',
    userOps: [simpleAccountV06WithCreationAndVerifyingPaymaster, simpleAccountV06WithCreationAndVerifyingPaymaster]
  },
  {
    name: 'single-zerodev-kernel-lite-with-creation-and-paymaster',
    userOps: [kernelLiteV23WithCreationAndVerifyingPaymaster]
  },
  {
    name: 'double-zerodev-kernel-lite-with-creation-and-paymaster',
    userOps: [kernelLiteV23WithCreationAndVerifyingPaymaster, kernelLiteV23WithCreationAndVerifyingPaymaster]
  }
]
