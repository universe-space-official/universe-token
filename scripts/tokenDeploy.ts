import { run, ethers } from "hardhat";
import { UniverseToken__factory } from "../types";

async function deploy() {


    const ownerAddress = '';
    const priceFeedAddress = '';
    const univTokenUSD = '';



    const universeFactory = (await ethers.getContractFactory("UniverseToken")) as UniverseToken__factory;
    const univToken = await universeFactory.deploy(ownerAddress, priceFeedAddress, univTokenUSD);

    await univToken.deployed();
    console.log("Univ Token deployed at", univToken.address);

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
            constructorArguments: [ownerAddress, priceFeedAddress, univTokenUSD],
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