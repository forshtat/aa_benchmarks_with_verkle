// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {EntryPoint as EntryPointV06} from "@account-abstraction/contracts/core/EntryPoint.sol";
import {VerifyingPaymaster as VerifyingPaymasterV06} from "@account-abstraction/contracts/samples/VerifyingPaymaster.sol";
import {SimpleAccount as SimpleAccountV06} from "@account-abstraction/contracts/samples/SimpleAccount.sol";
import {SimpleAccountFactory as SimpleAccountFactoryV06} from "@account-abstraction/contracts/samples/SimpleAccountFactory.sol";

contract Artifacts {
    EntryPointV06 public entryPoint;
    SimpleAccountV06 public simpleAccount;
    SimpleAccountFactoryV06 public simpleAccountFactory;
    VerifyingPaymasterV06 public verifyingPaymaster;
}
