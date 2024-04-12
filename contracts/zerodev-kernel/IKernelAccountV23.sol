// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

    enum Operation {
        Call,
        DelegateCall
    }

interface IKernelAccountV23 {
    function initialize(
        address _defaultValidator,
        bytes calldata _data
    )
    external
    payable;

    function execute(
        address to,
        uint256 value,
        bytes memory data,
        Operation _operation
    )
    external
    payable;
}
