import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { ensureMultipleATAsExist } from "./ensure-ata";

export interface BuildPaymentTransactionParams {
  connection: Connection;
  payerPublicKey: PublicKey;
  agentWalletPublicKey: PublicKey;
  protocolWalletPublicKey: PublicKey;
  amountBase: number;
  protocolFeeBase: number;
  tokenMint: string; // 'SOL' or USDC mint address
  tokenDecimals: number; // 9 for SOL, 6 for USDC
  debug?: boolean; // Optional: enable console logging
}

export async function buildAgentPaymentTransaction(
  params: BuildPaymentTransactionParams
): Promise<{ transaction: Transaction; atasCreated: number }> {
  const {
    connection,
    payerPublicKey,
    agentWalletPublicKey,
    protocolWalletPublicKey,
    amountBase,
    protocolFeeBase,
    tokenMint,
    debug = false,
  } = params;

  const transaction = new Transaction();
  const isSOL = tokenMint === "SOL";

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payerPublicKey;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  if (isSOL) {
    // SOL transfers (simple)
    if (debug) console.log("💰 Building SOL payment transaction");

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payerPublicKey,
        toPubkey: agentWalletPublicKey,
        lamports: Math.floor(amountBase - protocolFeeBase),
      })
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payerPublicKey,
        toPubkey: protocolWalletPublicKey,
        lamports: Math.floor(protocolFeeBase),
      })
    );

    if (debug) {
      console.log(`   Total: ${amountBase} lamports`);
      console.log(`   Agent: ${amountBase - protocolFeeBase} lamports`);
      console.log(`   Protocol: ${protocolFeeBase} lamports`);
    }

    return { transaction, atasCreated: 0 };
  }

  // USDC transfers (SPL Token)
  if (debug) console.log("💰 Building USDC payment transaction");

  const mintPublicKey = new PublicKey(tokenMint);

  // Get payer's ATA
  const payerATA = await getAssociatedTokenAddress(mintPublicKey, payerPublicKey);

  // Ensure recipient ATAs exist
  const { atas, instructions: ataInstructions, summary } = await ensureMultipleATAsExist(
    connection,
    mintPublicKey,
    [agentWalletPublicKey, protocolWalletPublicKey],
    payerPublicKey
  );

  const [agentATA, protocolATA] = atas;

  if (debug) {
    console.log(`   ATAs: ${summary.existed} existing, ${summary.created} to be created`);
  }

  // Add ATA creation instructions (if any)
  ataInstructions.forEach((instruction) => transaction.add(instruction));

  // Add USDC transfers
  const agentAmount = Math.floor(amountBase - protocolFeeBase);

  transaction.add(
    createTransferInstruction(payerATA, agentATA, payerPublicKey, agentAmount)
  );

  transaction.add(
    createTransferInstruction(payerATA, protocolATA, payerPublicKey, Math.floor(protocolFeeBase))
  );

  if (debug) {
    console.log(`   Total: ${amountBase} base units`);
    console.log(`   Agent: ${agentAmount} base units`);
    console.log(`   Protocol: ${protocolFeeBase} base units`);
  }

  return { transaction, atasCreated: summary.created };
}
