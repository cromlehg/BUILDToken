import ether from '../helpers/ether';
import tokens from '../helpers/tokens';
import {advanceBlock} from '../helpers/advanceToBlock';
import {increaseTimeTo, duration} from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import EVMRevert from '../helpers/EVMRevert';

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

export default function (Token, Crowdsale, wallets) {
  let token;
  let crowdsale;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    token = await Token.new();
    crowdsale = await Crowdsale.new();
    await token.setSaleAgent(crowdsale.address);
    await crowdsale.setToken(token.address);
    await crowdsale.setStart(latestTime());
    await crowdsale.setPrice(this.price);
    await crowdsale.setHardcap(this.hardcap);
    await crowdsale.setMinInvestedLimit(this.minInvestedLimit);
    await crowdsale.addMilestone(15, 25);
    await crowdsale.addMilestone(15, 20);
    await crowdsale.addMilestone(15, 15);
    await crowdsale.addMilestone(15, 10);
    await crowdsale.addMilestone(30, 5);
    await crowdsale.setWallet(this.wallet);
    await crowdsale.addWallet(wallets[9], this.BountyTokensPercent);
    await crowdsale.addWallet(wallets[8], this.AdvisorsTokensPercent);
    await crowdsale.addWallet(wallets[7], this.FoundersTokensPercent);
    await crowdsale.addWallet(wallets[10], this.CompanyTokensPercent);
    await crowdsale.setPercentRate(this.PercentRate);
    await crowdsale.lockAddress(wallets[9], 30);
    await crowdsale.lockAddress(wallets[8], 90);
    await crowdsale.lockAddress(wallets[7], 180);
  });

  it('should mintTokensByETHExternal by owner', async function () {
    const owner = await crowdsale.owner();
    await crowdsale.mintTokensByETHExternal(wallets[4], ether(1), {from: owner}).should.be.fulfilled;
    const balance = await token.balanceOf(wallets[4]);
    balance.should.bignumber.equal(this.price.times(1.25));
  });

  it('should mintTokensByETHExternal by Direct Mint Agend', async function () {
    const owner = await crowdsale.owner();
    await crowdsale.setDirectMintAgent(wallets[2], {from: owner});
    await crowdsale.mintTokensByETHExternal(wallets[5], ether(1), {from: wallets[2]}).should.be.fulfilled;
    const balance = await token.balanceOf(wallets[5]);
    balance.should.bignumber.equal(this.price.times(1.25));
  });

  it('should mintTokensExternal by owner', async function () {
    const owner = await crowdsale.owner();
    await crowdsale.mintTokensExternal(wallets[4], tokens(100), {from: owner}).should.be.fulfilled;
    const balance = await token.balanceOf(wallets[4]);
    balance.should.bignumber.equal(tokens(100));
  });

  it('should mintTokensExternal by Direct Mint Agent', async function () {
    const owner = await crowdsale.owner();
    await crowdsale.setDirectMintAgent(wallets[3], {from: owner});
    await crowdsale.mintTokensExternal(wallets[6], tokens(100), {from: wallets[3]}).should.be.fulfilled;
    const balance = await token.balanceOf(wallets[6]);
    balance.should.bignumber.equal(tokens(100));
  });

  it('should use wallet for investments', async function () {
    const investment = ether(1);
    const pre = web3.eth.getBalance(this.wallet);
    const owner = await crowdsale.owner();
    await crowdsale.sendTransaction({value: investment, from: wallets[1]});
    const post = web3.eth.getBalance(this.wallet);
    post.minus(pre).should.bignumber.equal(investment);
  });

  it('should lock bounty, advisors, founders wallet address after finish', async function () {
    const owner = await crowdsale.owner();
    const investment = ether(10);
    await crowdsale.sendTransaction({value: investment, from: wallets[1]});
    await crowdsale.finish({from: owner});
    await token.transfer(wallets[2], tokens(100), {from: wallets[1]}).should.be.fulfilled;
    const balance = await token.balanceOf(wallets[9]);
    balance.should.bignumber.greaterThan(tokens(100));
    await token.transfer(wallets[3], tokens(100), {from: wallets[9]}).should.be.rejectedWith(EVMRevert);
    await token.transfer(wallets[3], tokens(100), {from: wallets[8]}).should.be.rejectedWith(EVMRevert);
    await token.transfer(wallets[3], tokens(100), {from: wallets[7]}).should.be.rejectedWith(EVMRevert);
    await token.transfer(wallets[3], tokens(100), {from: wallets[10]}).should.be.fulfilled;
  });

  it('should unlock bounty wallet address after 30 days', async function () {
    const owner = await crowdsale.owner();
    const investment = ether(10);
    await crowdsale.sendTransaction({value: investment, from: wallets[1]});
    await crowdsale.finish({from: owner});
    await increaseTimeTo(latestTime() + duration.days(31));
    await token.transfer(wallets[3], tokens(100), {from: wallets[9]}).should.be.fulfilled;
    const balance = await token.balanceOf(wallets[3]);
    balance.should.bignumber.equal(tokens(100));
    await token.transfer(wallets[3], tokens(100), {from: wallets[8]}).should.be.rejectedWith(EVMRevert);
    await token.transfer(wallets[3], tokens(100), {from: wallets[7]}).should.be.rejectedWith(EVMRevert);
    await token.transfer(wallets[3], tokens(100), {from: wallets[10]}).should.be.fulfilled;
  });

  it('should unlock advisors wallet address after 90 days', async function () {
    const owner = await crowdsale.owner();
    const investment = ether(10);
    await crowdsale.sendTransaction({value: investment, from: wallets[1]});
    await crowdsale.finish({from: owner});
    await increaseTimeTo(latestTime() + duration.days(91));
    await token.transfer(wallets[3], tokens(100), {from: wallets[8]}).should.be.fulfilled;
    const balance = await token.balanceOf(wallets[3]);
    balance.should.bignumber.equal(tokens(100));
    await token.transfer(wallets[3], tokens(100), {from: wallets[9]}).should.be.fulfilled;
    await token.transfer(wallets[3], tokens(100), {from: wallets[7]}).should.be.rejectedWith(EVMRevert);
    await token.transfer(wallets[3], tokens(100), {from: wallets[10]}).should.be.fulfilled;
  });

  it('should unlock founders wallet address after 180 days', async function () {
    const owner = await crowdsale.owner();
    const investment = ether(10);
    await crowdsale.sendTransaction({value: investment, from: wallets[1]});
    await crowdsale.finish({from: owner});
    await increaseTimeTo(latestTime() + duration.days(181));
    await token.transfer(wallets[3], tokens(100), {from: wallets[7]}).should.be.fulfilled;
    const balance = await token.balanceOf(wallets[3]);
    balance.should.bignumber.equal(tokens(100));
    await token.transfer(wallets[3], tokens(100), {from: wallets[9]}).should.be.fulfilled;
    await token.transfer(wallets[3], tokens(100), {from: wallets[8]}).should.be.fulfilled;
    await token.transfer(wallets[3], tokens(100), {from: wallets[10]}).should.be.fulfilled;
  });

  it('should mint tokens batch', async function () {
    const owner = await crowdsale.owner();
    await crowdsale.mintTokensBatch(tokens(100),[wallets[1],wallets[2],wallets[3]],{from: owner});
    
    const balance1 = await token.balanceOf(wallets[1]);
    balance1.should.bignumber.equal(tokens(100));
    const balance2 = await token.balanceOf(wallets[2]);
    balance2.should.bignumber.equal(tokens(100));
    const balance3= await token.balanceOf(wallets[3]);
    balance3.should.bignumber.equal(tokens(100));
    
  });

}
