import { ethers, waffle } from "hardhat";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { UniverseToken, UniverseToken__factory, DummyStableCoin__factory, DummyStableCoin, MockAggregator__factory, MockAggregator } from "../types";

describe.only('Univ token tests', async () => {
    let univToken: UniverseToken, univTokenFactory: UniverseToken__factory;
    let mockVRF: MockAggregator, mockVRFactory: MockAggregator__factory;
    let adminSigner: Signer, aliceSigner: Signer, bobSigner: Signer;
    let admin: string, alice: string, bob: string;
    let mockStableCoin: DummyStableCoin, mockStableCoinFactory: DummyStableCoin__factory;

    let provider: any;


    before(async () => {
        univTokenFactory = await ethers.getContractFactory("UniverseToken");
        mockStableCoinFactory = await ethers.getContractFactory("DummyStableCoin");
        mockStableCoin = await mockStableCoinFactory.deploy("Coin Test", "CT");
        mockVRFactory = await ethers.getContractFactory("MockAggregator");
        mockVRF = await mockVRFactory.deploy();


    });
    beforeEach(async () => {

        [adminSigner, aliceSigner, bobSigner] = await ethers.getSigners();
        admin = await adminSigner.getAddress();
        alice = await aliceSigner.getAddress();
        bob = await bobSigner.getAddress();
        // univToken = await univTokenFactory.deploy(admin, constants.AddressZero);
        provider = waffle.provider;



    });
    it("Should be able to deploy the token", async () => {

        await expect(univTokenFactory.deploy(admin, mockVRF.address, ethers.utils.parseEther('0.12'))).to.not.be.reverted;


    });

    it("Should be mint more tokens as owner only", async () => {

        univToken = await univTokenFactory.deploy(admin, mockVRF.address, ethers.utils.parseEther('0.12'));
        await expect(univToken.mint(11)).to.not.be.reverted;
        await expect(univToken.connect(bobSigner).mint(11)).to.be.reverted;


    });

    it("Should be able to withdraw tokens as owner only", async () => {

        // transfering tokens to contract
        await mockStableCoin.transfer(univToken.address, 111)
        await expect(univToken.withdrawTokens(mockStableCoin.address)).to.not.be.reverted;
        await expect(univToken.connect(bobSigner).withdrawTokens(mockStableCoin.address)).to.be.reverted;

    });



    it("Owner transfers without fees, other users get taxed", async () => {

        await univToken.setTransferFee(18);
        await univToken.mint(111);
        await univToken.transfer(bob, 111);
        expect(await univToken.balanceOf(bob)).to.be.equal('111');

        await univToken.connect(bobSigner).transfer(alice, 111);
        expect(await univToken.balanceOf(alice)).to.be.below('111');


    });



    it("Users can only  buy when it is not paused", async () => {

        await univToken.pauseBuys(true);
        await expect(univToken.connect(bobSigner).buyTokensWithNative({
            value: ethers.utils.parseEther("0.001")
        })).to.be.reverted;


        await univToken.pauseBuys(false);



        await expect(univToken.connect(bobSigner).buyTokensWithNative({
            value: ethers.utils.parseEther("1")
        })).to.not.be.reverted;

    });


    it("Can only buy with accepted stable coins", async () => {

        const notAcceptedCoin = await mockStableCoinFactory.deploy("Coin Test", "CT");
        await univToken.addAcceptedStableCoin(mockStableCoin.address);


        await mockStableCoin.transfer(bob, 111)
        await notAcceptedCoin.transfer(bob, 111)


        await mockStableCoin.connect(bobSigner).approve(univToken.address, 111);
        await notAcceptedCoin.connect(bobSigner).approve(univToken.address, 111);

        await expect(univToken.connect(bobSigner).buyTokensWithStable(notAcceptedCoin.address, 111
        )).to.be.reverted



        await expect(univToken.connect(bobSigner).buyTokensWithStable(mockStableCoin.address, 111
        )).to.not.be.reverted

    });

    it("Calculation tests", async () => {

        await univToken.setTransferFee(0);


        await mockStableCoin.transfer(alice, ethers.utils.parseEther("100"))
        await mockStableCoin.connect(aliceSigner).approve(univToken.address, ethers.utils.parseEther("100"));




        await univToken.connect(aliceSigner).buyTokensWithStable(mockStableCoin.address, ethers.utils.parseEther("100"))
        expect(Number(ethers.utils.formatEther(await univToken.balanceOf(alice)))).to.be.closeTo(100 / (0.12), 0.00001);


        await univToken.connect(aliceSigner).transfer(bob, await univToken.balanceOf(alice))

        await expect(univToken.connect(aliceSigner).buyTokensWithNative({
            value: ethers.utils.parseEther("100")
        })).to.not.be.reverted;


        expect(Number(ethers.utils.formatEther(await univToken.balanceOf(alice)))).to.be.closeTo(100 / (0.12), 0.00001);





    });





});


