import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import { ethers } from 'ethers';

dotenv.config();

const app: Express = express();

const port = process.env.PORT;
const RPC_URL = process.env.RPC_URL as string;

let latestMONTS: number;
let latestMONCS: number;
let latestDCHFTS: number;
let latestDCHFCS: number;

initialize();

async function initialize() {
    await fetchData();
}

async function fetchData() {
    while (true) {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const addresses = require('../assets/addresses.json');
        const abi = require('../assets/abi/ERC20.json');
        const monToken = new ethers.Contract(addresses.monToken, abi, provider);
        const dchfToken = new ethers.Contract(addresses.dchfToken, abi, provider);

        const monTotalSupply = Number(ethers.utils.formatEther(await monToken.totalSupply()));
        const dchfTotalSupply = Number(ethers.utils.formatEther(await dchfToken.totalSupply()));

        const dchfCirculatingSupply = dchfTotalSupply;

        let excludeFromTotalSupplyMon = 0;

        for await (let address of addresses.monExcludedAddresses) {
            const balance = Number(ethers.utils.formatEther(await monToken.balanceOf(address)));
            excludeFromTotalSupplyMon += balance;
        }

        const monCirculatingSupply = monTotalSupply - excludeFromTotalSupplyMon;

        latestMONTS = Math.round(monTotalSupply);
        latestMONCS = Math.round(monCirculatingSupply);
        latestDCHFTS = Math.round(dchfTotalSupply);
        latestDCHFCS = Math.round(dchfCirculatingSupply);

        await delay(30000);
    }


}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/', async (req: Request, res: Response) => {
    res.json({ message: 'Supply up running' });
});

app.get('/total-supply/mon', async (req: Request, res: Response) => {
    res.json(latestMONTS);
});

app.get('/total-supply/dchf', async (req: Request, res: Response) => {
    res.json(latestDCHFTS);
});

app.get('/circulating-supply/mon', async (req: Request, res: Response) => {
    res.json(latestMONCS);
});

app.get('/circulating-supply/dchf', async (req: Request, res: Response) => {
    res.json(latestDCHFCS);
});

/* Error handler middleware */
app.use((err: any, req: Request, res: Response, next: any) => {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);
    res.status(statusCode).json({ 'message': err.message });

    return;
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});