import 'dotenv/config';
import { HardhatUserConfig } from 'hardhat/types';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import '@typechain/hardhat';
import 'solidity-coverage';
import "@nomiclabs/hardhat-etherscan";

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.4",
            },
            {
                version: "0.8.17",
            },
        ]
    },
    networks: {
        hardhat: {
        },
        bsc_testnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
            accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
            saveDeployments: true,
            tags: ["staging"],
        },
        bsc_mainnet: {
            url: "https://bsc-dataseed.binance.org/",
            accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
            saveDeployments: true,
            tags: ["staging"],
        },
        mumbai_testnet: {
            url: "https://polygon-mumbai.g.alchemy.com/v2/UcJQZqq6LT_gfzyMrFZh0PD0GWni4R6a",
            accounts: process.env.DEPLOYER_PRIVATE_KEY
                ? [process.env.DEPLOYER_PRIVATE_KEY as string]
                : undefined,
        },
        polygon_mainnet: {
            url: "https://polygon-mumbai.g.alchemy.com/v2/UcJQZqq6LT_gfzyMrFZh0PD0GWni4R6a",
            accounts: process.env.DEPLOYER_PRIVATE_KEY
                ? [process.env.DEPLOYER_PRIVATE_KEY as string]
                : undefined,
        },

        goerli_testnet: {
            url: "https://eth-goerli.g.alchemy.com/v2/9uBn6tP-dnV1Q--N63iq6RHmF6wNMEWH",
            accounts: process.env.DEPLOYER_PRIVATE_KEY
                ? [process.env.DEPLOYER_PRIVATE_KEY as string]
                : undefined,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
            goerli_testnet: '0xe699c7548B1E4ecFb124c4b09ebB33cEC6766975'
        },
        admin: {
            goerli_testnet: '0xe699c7548B1E4ecFb124c4b09ebB33cEC6766975',
        },
        tokenBeneficiary: {
            default: 0,
            goerli_testnet: '0xe699c7548B1E4ecFb124c4b09ebB33cEC6766975'
        },
    },
    paths: {
        sources: 'contracts',
    },
    typechain: {
        outDir: 'types',
        target: 'ethers-v5',
    },
    etherscan: {
        apiKey: {
            goerli: process.env.EXPLORER_API_KEY_MAINNET || '',
            // add other network's API key here
            polygonMumbai: process.env.EXPLORER_API_KEY_POLYGON || '',
            bscTestnet: process.env.EXPLORER_API_KEY_BSC || '',
            bsc: process.env.EXPLORER_API_KEY_BSC || ''
        },

    },


};



export default config;
