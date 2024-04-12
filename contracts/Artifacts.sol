// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {EntryPoint as EntryPointV06} from "@account-abstraction/contracts/core/EntryPoint.sol";
import {SimpleAccount as SimpleAccountV06} from "@account-abstraction/contracts/samples/SimpleAccount.sol";
import {SimpleAccountFactory as SimpleAccountFactoryV06} from "@account-abstraction/contracts/samples/SimpleAccountFactory.sol";
import {ERC20} from  "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Artifacts {
    EntryPointV06 public entryPoint;
    SimpleAccountV06 public simpleAccount;
    SimpleAccountFactoryV06 public simpleAccountFactory;
    ERC20 public erc20;
}
