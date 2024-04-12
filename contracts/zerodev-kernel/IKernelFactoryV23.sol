// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IKernelFactoryV23 {

    function createAccount(address _implementation, bytes calldata _data, uint256 _index)
    external
    payable
    returns (address proxy);

    function getAccountAddress(bytes calldata _data, uint256 _index)
    external
    view
    returns (address);

}
