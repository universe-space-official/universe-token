import { run, ethers } from "hardhat";
import { Universe__factory } from "../types";

async function deploy() {


    const ownerAddress = '';
    const priceFeedAddress = '';


    const universeFactory = (await ethers.getContractFactory("SrgToken")) as Universe__factory;
    const univToken = await universeFactory.deploy(ownerAddress, priceFeedAddress);

    await univToken.deployed();
    console.log("SRG Token deployed at", univToken.address);

    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);

    /**
     * Programmatic verification
     */

    try {
        await run("verify:verify", {
            address: univToken.address,
            contract: "contracts/UniverseToken.sol:UniverseToken",
            constructorArguments: [ownerAddress, priceFeedAddress],
        });
    } catch (e: any) {
        console.error(`error in verifying: ${e.message}`);
    }
    return univToken.address;
}

if (require.main === module) {
    deploy();
}

export { deploy };