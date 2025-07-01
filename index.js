// require('dotenv').config();
// const express = require('express');
// const { ethers } = require('ethers');

// const app = express();
// const port = process.env.PORT || 3000;
// app.use(express.json());

// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// const tokenAbi = require('./ZCLUE_ABI.json');
// const zclue = new ethers.Contract(process.env.ZCLUE_TOKEN_ADDRESS, tokenAbi, wallet);

// app.post('/transfer', async (req, res) => {
//   const { to, amount } = req.body;
//   if (!to || !amount) return res.status(400).json({ message: 'to et amount requis' });

//   try {
//     const decimals = await zclue.decimals();
//     const amountFormatted = ethers.parseUnits(amount.toString(), decimals);
//     const tx = await zclue.transfer(to, amountFormatted);
//     await tx.wait();
//     return res.json({ message: 'transfert done', tx: tx.hash });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'transfert error', error: err.message });
//   }
// });

// app.listen(port, () => console.log(`ZCLUE microservice running on port ${port}`));

// // index.js - Microservice for ZClue token claim via ThirdWeb
import express from 'express';
import dotenv from 'dotenv';
import { createThirdwebClient, Engine } from 'thirdweb';
import { getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { claimTo } from 'thirdweb/extensions/erc20';

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

// ERC20 Claim Endpoint
app.post('/claim', async (req, res) => {
  const { to, amount } = req.body;

  if (!to || !amount) {
    return res.status(400).json({ message: 'Missing "to" or "amount" parameter.' });
  }

  try {
    const contract = getContract({
      client,
      address: process.env.ZCLUE_TOKEN_ADDRESS,
      chain: defineChain(97), // Replace with bscTestnet or mainnet as needed
    });

    const transaction = claimTo({
      contract,
      to,
      quantity: BigInt(amount),
    });

    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });

    const txHash = await Engine.waitForTransactionHash({ client, transactionId });
    return res.status(200).json({ message: 'Claim successful', txHash });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Claim failed', error: error.message });
  }
});

// Health check route
app.get('/', (req, res) => {
  res.send('ZClue Claim Microservice is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
