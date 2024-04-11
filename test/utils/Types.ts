export enum WalletImplementation {
  simpleAccount_v6 = 0,
  simpleAccount_v7 = 1,
  zerodevKernelLite_v2_3 = 2
}

export enum GasPaymentStrategy {
  accountDeposit = 0,
  accountBalance = 1,
  paymasterDeposit = 2,
  paymasterBalance = 3
}

export enum PaymasterType {
  noPaymaster = 0,
  verifyingPaymaster = 0,
  erc20TokenPaymaster = 1
}

export enum CreationStrategy {
  usePreCreatedAccount = 0,
  useDeployerInUserOp = 1
}

export enum UserOpAction {
  valueTransfer = 0,
  erc20Transfer = 1
}

export interface UserOpDescription {
  walletImplementation: WalletImplementation
  paymasterType: PaymasterType
  gasPaymentStrategy: GasPaymentStrategy
  creationStrategy: CreationStrategy
  userOpAction: UserOpAction
}

export interface BundleDescription {
  name: string
  userOps: UserOpDescription[]
}
