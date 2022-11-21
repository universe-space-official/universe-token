import { constants } from "ethers";
import { run, ethers } from "hardhat";
import { SrgToken__factory, ColdStaking__factory, ERC20 } from "../types";

async function deploy() {


    // const coldStakingFac = await ethers.getContractFactory("ColdStaking") as ColdStaking__factory;


    // const coldStaking = await coldStakingFac.deploy()
    const ERC20_token = (await ethers.getContractFactory("SrgToken")) as SrgToken__factory;
    const erc20 = await ERC20_token.deploy("0x047642994D4A327833d71760c4Fe7d08f304d96E", constants.AddressZero);

    await erc20.deployed();
    console.log("SRG Token deployed at", erc20.address);

    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);

    /**
     * Programmatic verification
     */

    try {
        await run("verify:verify", {
            address: erc20.address,
            contract: "contracts/SrgToken.sol:SrgToken",
            constructorArguments: ["0x047642994D4A327833d71760c4Fe7d08f304d96E", constants.AddressZero],
        });
    } catch (e: any) {
        console.error(`error in verifying: ${e.message}`);
    }
    return erc20.address;
}

if (require.main === module) {
    deploy();
}

export { deploy };