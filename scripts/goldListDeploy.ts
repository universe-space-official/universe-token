import { run, ethers } from "hardhat";
import hre from "hardhat";
import { GoldList__factory, DummyStableCoin__factory } from "../types";


async function deploy() {

    const goldListFactory = await ethers.getContractFactory("GoldList") as GoldList__factory;
    const dummyStableCoinFactory = await ethers.getContractFactory("DummyStableCoin") as DummyStableCoin__factory

    const stableCoin1 = await dummyStableCoinFactory.deploy("USD Test", "USDI");


    console.log("Stable coin addresses for tests", stableCoin1.address);


    const SRGTokenAddressBSC = "0x5AE6862B92Fe443D2C4addD9C6e65Fc0C7ccdDc0";

    const USDCAddressBSC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
    const USDTAddressBSC = "0x55d398326f99059ff775485246999027b3197955"
    const BUSDAddressBSC = "0xe9e7cea3dedca5984780bafc599bd69add087d56"
    const DAIAddressBSC = "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3"


    const multiSigWallet = "0x047642994D4A327833d71760c4Fe7d08f304d96E"
    const admin = "0x047642994D4A327833d71760c4Fe7d08f304d96E"
    const acceptedStableCoins = [stableCoin1.address, USDCAddressBSC, USDTAddressBSC, BUSDAddressBSC, DAIAddressBSC];


    const goldList = await goldListFactory.deploy(SRGTokenAddressBSC, admin, multiSigWallet, acceptedStableCoins)



    await goldList.deployed();
    console.log("Gold list deployed at", goldList.address);

    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);

    try {
        await run("verify:verify", {
            address: goldList.address,
            contract: "contracts/GoldList.sol:GoldList",
            constructorArguments: [SRGTokenAddressBSC, admin, multiSigWallet, acceptedStableCoins],
        });
    } catch (e: any) {
        console.error(`error in verifying: ${e.message}`);
    }
    return goldList.address;


}

if (require.main === module) {
    deploy();
}

export { deploy };