import { run, ethers } from "hardhat";
import hre from "hardhat";
import { SrgToken__factory, ColdStaking, ColdStaking__factory } from "../types";

async function deploy() {

    // const coldStakingFactory = await ethers.getContractFactory("ColdStaking") as ColdStaking__factory;

    // // const networkName = hre.network.name


    // // let SRGTokenAddress = '';
    // // switch (networkName) {
    // //     case 'mumbai_testnet':
    // //         SRGTokenAddress = "0x5f4395996479eF6ff57da6f28779Cc8EA2350258"
    // //         break;
    // //     case 'bsc_mainnet':
    // //         SRGTokenAddress = "0x5AE6862B92Fe443D2C4addD9C6e65Fc0C7ccdDc0";
    // //         break;
    // //     case 'goerli_testnet':
    // //         SRGTokenAddress = "0x8D9a2BFd40B529Ca5F0a60b6606aec376554add0";
    // //         break;
    // // }



    // const coldStaking = await coldStakingFactory.deploy("0x5AE6862B92Fe443D2C4addD9C6e65Fc0C7ccdDc0")



    // await coldStaking.deployed();
    // console.log("Cold staking deployed at", coldStaking.address);

    // function delay(ms: number) {
    //     return new Promise((resolve) => setTimeout(resolve, ms));
    // }

    // await delay(20000);

    try {
        await run("verify:verify", {
            address: "0x577B2EecadF6D8cA93237C849d1AF0D0bB0919B1",
            contract: "contracts/ColdStaking.sol:ColdStaking",
            constructorArguments: ["0x5AE6862B92Fe443D2C4addD9C6e65Fc0C7ccdDc0"],
        });
    } catch (e: any) {
        console.error(`error in verifying: ${e.message}`);
    }
    return "0x577B2EecadF6D8cA93237C849d1AF0D0bB0919B1";


}

if (require.main === module) {
    deploy();
}

export { deploy };