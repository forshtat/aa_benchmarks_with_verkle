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
  gasPaymentStrategy: GasPaymentStrategy.accountDeposit,
  creationStrategy: CreationStrategy.usePreCreatedAccount,
  userOpAction: UserOpAction.valueTransfer
}

export const simpleAccountV06WithCreation: UserOpDescription = {
  ...simpleAccountV06Baseline,
  gasPaymentStrategy: GasPaymentStrategy.accountBalance,
  creationStrategy: CreationStrategy.useDeployerInUserOp
}

export const simpleAccountV06VerifyingPaymaster: UserOpDescription = {
  ...simpleAccountV06Baseline,
  paymasterType: PaymasterType.verifyingPaymaster
}

export const kernelLiteV23Baseline: UserOpDescription = {
  ...simpleAccountV06Baseline,
  walletImplementation: WalletImplementation.zerodevKernelLite_v2_3
}

export const kernelLiteV23WithCreation: UserOpDescription = {
  ...kernelLiteV23Baseline,
  gasPaymentStrategy: GasPaymentStrategy.accountBalance,
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
    name: 'single-simple-account-eth-transfer-baseline',
    userOps: [simpleAccountV06Baseline]
  },
  {
    name: 'double-simple-account-eth-transfer-baseline',
    userOps: [simpleAccountV06Baseline, simpleAccountV06Baseline]
  },
  {
    name: 'three-simple-account-eth-transfer-(A->X B->Y A->Z)',
    userOps: [simpleAccountV06Baseline, simpleAccountV06Baseline, simpleAccountV06Baseline],
    reuseAccounts: [0, 1, 0]
  },
  {
    name: 'four-simple-account-eth-transfer-(A->X B->Y A->Z B->W)',
    userOps: [simpleAccountV06Baseline, simpleAccountV06Baseline, simpleAccountV06Baseline, simpleAccountV06Baseline],
    reuseAccounts: [0, 1, 0, 1]
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
    name: 'three-zerodev-kernel-eth-transfer-(A->X B->Y A->Z)',
    userOps: [kernelLiteV23Baseline, kernelLiteV23Baseline, kernelLiteV23Baseline],
    reuseAccounts: [0, 1, 0]
  },
  {
    name: 'four-zerodev-kernel-eth-transfer-(A->X B->Y A->Z B->W)',
    userOps: [kernelLiteV23Baseline, kernelLiteV23Baseline, kernelLiteV23Baseline, kernelLiteV23Baseline],
    reuseAccounts: [0, 1, 0, 1]
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
    name: 'single-zerodev-kernel-lite-with-creation',
    userOps: [kernelLiteV23WithCreation]
  },
  {
    name: 'double-zerodev-kernel-lite-with-creation',
    userOps: [kernelLiteV23WithCreation, kernelLiteV23WithCreation]
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
