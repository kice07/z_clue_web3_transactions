// index.js - Microservice for ZClue token transfer via ThirdWeb
import express from 'express';
import dotenv from 'dotenv';
import { createThirdwebClient, Engine } from 'thirdweb';
import { getContract, sendTransaction } from 'thirdweb';
import { bscTestnet } from 'thirdweb/chains';
import { transfer } from 'thirdweb/extensions/erc20';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// ThirdWeb configuration
const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY,
});

const serverWallet = Engine.serverWallet({
    client,
    address: process.env.SERVER_WALLET_ADDRESS,
    vaultAccessToken: process.env.VAULT_ACCESS_TOKEN,
});

const contract = getContract({
    client,
    address: process.env.ZCLUE_TOKEN_ADDRESS,
    chain: bscTestnet, // Replace with bscTestnet or mainnet as needed
});

const balance = await contract.erc20.balanceOf(serverWallet.address);
console.log(balance);

// ERC20 Transfer Endpoint
app.post('/transfer', async (req, res) => {
    const { to, amount } = req.body;

    if (!to || !amount) {
        return res.status(400).json({ message: 'Missing "to" or "amount" parameter.' });
    }

    try {
        const contract = getContract({
            client,
            address: process.env.ZCLUE_TOKEN_ADDRESS,
            chain: bscTestnet, // Replace with bscTestnet or mainnet as needed
        });

        const transaction = transfer({
            contract,
            to,
            amount: BigInt(amount),
        });

        const { transactionId } = await serverWallet.enqueueTransaction({ transaction });

        const txHash = await Engine.waitForTransactionHash({ client, transactionId });
        return res.status(200).json({ message: 'Transfer successful', txHash });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Transfer failed', error: error.message });
    }
});

// Health check route
app.get('/', (req, res) => {
    res.send('ZClue Transfer Microservice is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
