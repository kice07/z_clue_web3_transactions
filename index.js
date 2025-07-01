require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const tokenAbi = require('./ZCLUE_ABI.json');
const zclue = new ethers.Contract(process.env.ZCLUE_TOKEN_ADDRESS, tokenAbi, wallet);

app.post('/transfer', async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !amount) return res.status(400).json({ message: 'to et amount requis' });

  try {
    const decimals = await zclue.decimals();
    const amountFormatted = ethers.parseUnits(amount.toString(), decimals);
    const tx = await zclue.transfer(to, amountFormatted);
    await tx.wait();
    return res.json({ message: 'transfert done', tx: tx.hash });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'transfert error', error: err.message });
  }
});

app.listen(port, () => console.log(`ZCLUE microservice running on port ${port}`));
