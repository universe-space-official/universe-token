import { network, ethers } from "hardhat";
import { expect } from "./chai-setup";
import { BigNumber, Signer, VoidSigner, constants } from "ethers";
import { solidity } from "ethereum-waffle";
import { SrgToken, SrgToken__factory, ColdStaking, ColdStaking__factory } from "../types";
import { isAddress } from "ethers/lib/utils";

describe.only('Cold staking tests', async () => {
    let srgToken: SrgToken, srgFactory: SrgToken__factory;
    let coldStaking: ColdStaking, coldFactory: ColdStaking__factory;
    let adminSigner: Signer, aliceSigner: Signer, bobSigner: Signer;
    let admin: string, alice: string, bob: string;

    let dayInSeconds = 86400;
    before(async () => {
        coldFactory = await ethers.getContractFactory("ColdStaking");
        srgFactory = await ethers.getContractFactory("SrgToken");
    });
    beforeEach(async () => {
        [adminSigner, aliceSigner, bobSigner] = await ethers.getSigners();
        admin = await adminSigner.getAddress();
        alice = await aliceSigner.getAddress();
        bob = await bobSigner.getAddress();
        srgToken = await srgFactory.deploy(admin, constants.AddressZero);
        coldStaking = await coldFactory.deploy(srgToken.address);
    });
    it("Should be able to stake", async () => {

        await srgToken.setColdStakingAddress(coldStaking.address);


        await srgToken.transfer(bob, ethers.utils.parseEther('1000'))


        await srgToken.transfer(coldStaking.address, ethers.utils.parseEther('1000')) // transfering 1000 tokens


        // staking for 30 days
        await expect(coldStaking.connect(bobSigner).stake(ethers.utils.parseEther('10'), 30)).to.not.be.reverted;


    });

    it("Should not be able to stake more tokens than his balance of tokens", async () => {
        await srgToken.setColdStakingAddress(coldStaking.address);

        await srgToken.transfer(coldStaking.address, ethers.utils.parseEther('1000')) // transfering 1000 tokens

        await srgToken.transfer(bob, ethers.utils.parseEther('1000')) // transfering 1000 tokens


        await coldStaking.connect(bobSigner).stake(await srgToken.balanceOf(bob), 30)

        await expect(coldStaking.connect(bobSigner).stake(ethers.utils.parseEther('1'), 30)).to.be.revertedWith("Don't have any unlocked tokens to stake")



    });

    it("Should wait  lockduration to be able to withdraw", async () => {
        await srgToken.setColdStakingAddress(coldStaking.address);

        await srgToken.transfer(coldStaking.address, ethers.utils.parseEther('1000')) // transfering 1000 tokens

        await srgToken.transfer(bob, ethers.utils.parseEther('1000')) // transfering 1000 tokens


        await coldStaking.connect(bobSigner).stake(await srgToken.balanceOf(bob), 30)



        await expect(coldStaking.connect(bobSigner).unStake(BigNumber.from(0))).to.be.revertedWith("Stake has not expired");

    });

    it("Should be able to withdraw after expiration", async () => {
        await srgToken.setColdStakingAddress(coldStaking.address);

        await srgToken.transfer(coldStaking.address, ethers.utils.parseEther('1000')) // transfering 1000 tokens

        await srgToken.transfer(bob, ethers.utils.parseEther('1000')) // transfering 1000 tokens


        await coldStaking.connect(bobSigner).stake(await srgToken.balanceOf(bob), 30)

        const balancePreWithdraw = await srgToken.balanceOf(bob);


        await advanceTime(dayInSeconds * 30) // seconds in 30 days

        await expect(coldStaking.connect(bobSigner).unStake(BigNumber.from(0))).to.be.not.be.reverted;

        const balancPostWithdraw = await srgToken.balanceOf(bob);

        expect(balancPostWithdraw).to.be.above(balancePreWithdraw);
        expect(await coldStaking.balanceOf(bob)).to.be.equal(0);
    });

    it("Calculation tests", async () => {

        await srgToken.setColdStakingAddress(coldStaking.address);


        await srgToken.transfer(coldStaking.address, ethers.utils.parseEther('1000')) // transfering 1000 tokens

        await srgToken.transfer(bob, ethers.utils.parseEther('1000')) // transfering 1000 tokens


        // // User stakes 1 tokens for 365 days ... he should have 0.17985067 total reward

        await coldStaking.connect(bobSigner).stake(ethers.utils.parseEther('1'), 365)


        // first stake


        expect(ethers.utils.formatEther((await coldStaking.stakes(BigNumber.from(0))).finalReward)).to.be.equal('0.17985067');

        // user stakes 1 token for 30 days .... he should have


        //     APYBase = 6 %
        //     APYExtraDay = 0.0328358 %                    30
        //     finalReward = 1 * (6%+ 0.0328358%*(30))  * ------
        //                                                  365

        // finalReward = 0.005741156
        await coldStaking.connect(bobSigner).stake(ethers.utils.parseEther('1'), 30)



        expect(ethers.utils.formatEther((await coldStaking.stakes(BigNumber.from(1))).finalReward)).to.be.equal('0.005741156712328767');


    });


    it("Should be able to have several stakes with different durations", async () => {

        await srgToken.setColdStakingAddress(coldStaking.address);

        await srgToken.transfer(coldStaking.address, ethers.utils.parseEther('1000')) // transfering 1000 tokens

        await srgToken.transfer(bob, ethers.utils.parseEther('1000')) // transfering 1000 tokens


        await coldStaking.connect(bobSigner).stake(await ethers.utils.parseEther('35'), 35)


        await coldStaking.connect(bobSigner).stake(await ethers.utils.parseEther('40'), 40)

        await coldStaking.connect(bobSigner).stake(await ethers.utils.parseEther('45'), 45)



        await advanceTime(dayInSeconds * 35)

        await expect(coldStaking.connect(bobSigner).unStake(BigNumber.from(0))).to.be.not.be.reverted;

        await expect(coldStaking.connect(bobSigner).unStake(BigNumber.from(1))).to.be.revertedWith("Stake has not expired");

        await expect(coldStaking.connect(bobSigner).unStake(BigNumber.from(2))).to.be.revertedWith("Stake has not expired");

        await advanceTime(dayInSeconds * 5)

        await expect(coldStaking.connect(bobSigner).unStake(BigNumber.from(1))).to.be.not.be.reverted;

        await expect(coldStaking.connect(bobSigner).unStake(BigNumber.from(2))).to.be.revertedWith("Stake has not expired");


    });

    it("Only staker can unstake", async () => {

        await srgToken.setColdStakingAddress(coldStaking.address);

        await srgToken.transfer(coldStaking.address, ethers.utils.parseEther('1000')) // transfering 1000 tokens

        await srgToken.transfer(bob, ethers.utils.parseEther('1000')) // transfering 1000 tokens

        await coldStaking.connect(bobSigner).stake(await ethers.utils.parseEther('35'), 35)


        await advanceTime(dayInSeconds * 35)

        await expect(coldStaking.unStake(BigNumber.from(0))).to.be.revertedWith("Only staker can withdraw");

    });


    it("Shouldnt be able to transfer/ sell tokens if all his balance is staked", async () => {

        await srgToken.setColdStakingAddress(coldStaking.address);

        await srgToken.transfer(coldStaking.address, ethers.utils.parseEther('1000')) // transfering 1000 tokens

        await srgToken.transfer(bob, ethers.utils.parseEther('1000')) // transfering 1000 tokens


        await coldStaking.connect(bobSigner).stake(await srgToken.balanceOf(bob), 30)

        await expect(srgToken.connect(bobSigner).transfer(admin, ethers.utils.parseEther('1'))).to.be.revertedWith("Not enough unlocked")



    });

    it("Shouldnt be able to stake if contract doesn't have SRG", async () => {

        await srgToken.setColdStakingAddress(coldStaking.address);


        await srgToken.transfer(bob, ethers.utils.parseEther('1000')) // transfering 1000 tokens


        await expect(coldStaking.connect(bobSigner).stake(await srgToken.balanceOf(bob), 30)).to.be.revertedWith("Contract doesn't have enough SRG Token to give rewards")




    });


});


async function advanceTime(seconds: number) {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
}
