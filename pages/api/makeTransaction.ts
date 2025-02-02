import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { NextApiRequest, NextApiResponse } from "next"
import { shopAddress } from "../../lib/addresses"
import { treasuryAddress } from "../../lib/treasury"
import calculatePrice from "../../lib/calculatePrice"

export type MakeTransactionInputData = {
  account: string,
}

export type MakeTransactionOutputData = {
  transaction: string,
  message: string,
}

type ErrorOutput = {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
) {
  try {
    // We pass the selected items in the query, calculate the expected cost
    const amount = calculatePrice(req.query)
    if (amount.toNumber() === 0) {
      res.status(400).json({ error: "Can't checkout with charge of 0" })
      return
    }

    // We pass the reference to use in the query
    const { reference } = req.query
    if (!reference) {
      res.status(400).json({ error: "No reference provided" })
      return
    }

    // We pass the buyer's public key in JSON body
    const { account } = req.body as MakeTransactionInputData
    if (!account) {
      res.status(400).json({ error: "No account provided" })
      return
    }
    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopAddress
    const treasuryPublicKey = treasuryAddress

    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

    // Get a recent blockhash to include in the transaction
    const { blockhash } = await (connection.getLatestBlockhash('finalized'))

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The buyer pays the transaction fee
      feePayer: buyerPublicKey,
    })
    
    const payShopInstruction = SystemProgram.transfer({
      fromPubkey: buyerPublicKey,
      lamports: amount.multipliedBy(0.9).multipliedBy(LAMPORTS_PER_SOL).toNumber(),
      toPubkey: shopPublicKey
    })
    
    const payTreasuryInstruction = SystemProgram.transfer({
      fromPubkey: buyerPublicKey,
      lamports: amount.multipliedBy(0.1).multipliedBy(LAMPORTS_PER_SOL).toNumber(),
      toPubkey: treasuryPublicKey
    })
    
    payShopInstruction.keys.push({
      pubkey: new PublicKey(reference),
      isSigner: false,
      isWritable: false,
    })

    transaction.add(payShopInstruction, payTreasuryInstruction)
    
    // serialize transaction + return
    const serializedTransaction = transaction.serialize({
      // We will need the buyer to sign this transaction after it's returned to them
      requireAllSignatures: false
    })
    const base64 = serializedTransaction.toString('base64')

    // Insert into database: reference, amount

    // Return the serialized transaction
    res.status(200).json({
      transaction: base64,
      message: "Thanks for your post!",
    })
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: 'error creating transaction', })
    return
  }
}