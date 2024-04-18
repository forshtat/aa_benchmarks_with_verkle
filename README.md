# Evaluating impact of EIP-4762 on Accounts in ERC-4337

This project aims to provide a very close estimate of the effects the gas reform of EIP-4762
will have on various Smart Contract Accounts used in the ERC-4337 ecosystem.

Currently tested accounts are:
1. Infinitism SimpleAccount
2. Zerodev KernelLiteECDSA

Usage:

```shell
git submodule update --init --recursive

yarn

yarn hardhat-node &

yarn test

yarn estimate-verkle
```

The console output contains the summary of the effects of EIP-4762 on each contract accessed during the
execution of a `UserOperation`.

The generated file `verkle-effects-estimate.csv` contains the total EIP-4762 effects per test-case bundle.
