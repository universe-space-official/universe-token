import { run, ethers } from "hardhat";
import { UniverseToken__factory } from "../types";

async function deploy() {


    const ownerAddress = '0xED0262718A77e09C3C8F48696791747E878a5551';
    const univTokenUSD = ethers.utils.parseEther('0.12')

    const priceFeedETHUSD = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e" // goerli 


    const universeFactory = (await ethers.getContractFactory("UniverseToken")) as UniverseToken__factory;
    const univToken = await universeFactory.deploy(ownerAddress, priceFeedETHUSD, univTokenUSD);

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
            constructorArguments: [ownerAddress, priceFeedETHUSD, univTokenUSD],
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