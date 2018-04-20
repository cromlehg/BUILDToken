pragma solidity ^0.4.18;

import './AssembledCommonSale.sol';
import './StagedCrowdsale.sol';
import './ExtendedWalletsMintTokensFeature.sol';

contract ITO is ExtendedWalletsMintTokensFeature, StagedCrowdsale, AssembledCommonSale {

  address public lockAddress;

  uint public lockDays;

  function lockAddress(address newLockAddress, uint newLockDays) public onlyOwner {
    lockAddress = newLockAddress;
    lockDays = newLockDays;
  }

  function calculateTokens(uint _invested) internal returns(uint) {
    uint milestoneIndex = currentMilestone(start);
    Milestone storage milestone = milestones[milestoneIndex];
    uint tokens = _invested.mul(price).div(1 ether);
    if(milestone.bonus > 0) {
      tokens = tokens.add(tokens.mul(milestone.bonus).div(percentRate));
    }
    return tokens;
  }

  function endSaleDate() public view returns(uint) {
    return lastSaleDate(start);
  }

  function finish() public onlyOwner {
     mintExtendedTokens();
     token.lock(lockAddress, lockDays);
     token.finishMinting();
  }

}
