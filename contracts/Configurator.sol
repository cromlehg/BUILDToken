pragma solidity ^0.4.18;

import './ownership/Ownable.sol';
import './AssembledCommonSale.sol';
import './Token.sol';
import './PreITO.sol';
import './ITO.sol';

contract Configurator is Ownable {

  Token public token;

  PreITO public preITO;

  ITO public ito;

  function deploy() public onlyOwner {

    address manager = 0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770;

    token = new Token();

    preITO = new PreITO();
    ito = new ITO();

    commonConfigure(preITO);
    commonConfigure(ito);

    preITO.setWallet(0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770);
    preITO.setStart(1524441600);
    preITO.setPeriod(30);
    preITO.setPrice(6650000000000000000000);
    preITO.setSoftcap(3500000000000000000000);
    preITO.setHardcap(12000000000000000000000);

    token.setSaleAgent(preITO);

    ito.setWallet(0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770);
    ito.setStart(1527206400);
    ito.setHardcap(23000000000000000000000);
    ito.setPrice(5000000000000000000000);

    ito.addMilestone(10, 25);
    ito.addMilestone(15, 20);
    ito.addMilestone(15, 15);
    ito.addMilestone(15, 10);
    ito.addMilestone(5, 0);

    ito.addWallet(0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770, 2);
    ito.addWallet(0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770, 3);
    ito.addWallet(0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770, 11);
    ito.addWallet(0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770, 4);

    preITO.setNextSaleAgent(ito);

    token.transferOwnership(manager);
    preITO.transferOwnership(manager);
    ito.transferOwnership(manager);
  }

  function commonConfigure(AssembledCommonSale sale) internal {
    sale.setPercentRate(100);
    sale.setMinInvestedLimit(100000000000000000);
    sale.setToken(token);
  }

}

