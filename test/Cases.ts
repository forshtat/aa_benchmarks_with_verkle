import {
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

export const kernelLiteV23Baseline: UserOpDescription = {
  walletImplementation: WalletImplementation.zerodevKernelLite_v2_3,
  paymasterType: PaymasterType.noPaymaster,
  gasPaymentStrategy: GasPaymentStrategy.accountBalance,
  creationStrategy: CreationStrategy.usePreCreatedAccount,
  userOpAction: UserOpAction.valueTransfer
}
