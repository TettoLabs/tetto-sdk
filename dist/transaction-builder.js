"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentPaymentTransaction = buildAgentPaymentTransaction;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const ensure_ata_1 = require("./ensure-ata");
async function buildAgentPaymentTransaction(params) {
    const { connection, payerPublicKey, agentWalletPublicKey, protocolWalletPublicKey, amountBase, protocolFeeBase, tokenMint, debug = false, } = params;
    const transaction = new web3_js_1.Transaction();
    const isSOL = tokenMint === "SOL";
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPublicKey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    if (isSOL) {
        // SOL transfers (simple)
        if (debug)
            console.log("💰 Building SOL payment transaction");
        transaction.add(web3_js_1.SystemProgram.transfer({
            fromPubkey: payerPublicKey,
            toPubkey: agentWalletPublicKey,
            lamports: Math.floor(amountBase - protocolFeeBase),
        }));
        transaction.add(web3_js_1.SystemProgram.transfer({
            fromPubkey: payerPublicKey,
            toPubkey: protocolWalletPublicKey,
            lamports: Math.floor(protocolFeeBase),
        }));
        if (debug) {
            console.log(`   Total: ${amountBase} lamports`);
            console.log(`   Agent: ${amountBase - protocolFeeBase} lamports`);
            console.log(`   Protocol: ${protocolFeeBase} lamports`);
        }
        return { transaction, atasCreated: 0 };
    }
    // USDC transfers (SPL Token)
    if (debug)
        console.log("💰 Building USDC payment transaction");
    const mintPublicKey = new web3_js_1.PublicKey(tokenMint);
    // Get payer's ATA
    const payerATA = await (0, spl_token_1.getAssociatedTokenAddress)(mintPublicKey, payerPublicKey);
    // Ensure recipient ATAs exist
    const { atas, instructions: ataInstructions, summary } = await (0, ensure_ata_1.ensureMultipleATAsExist)(connection, mintPublicKey, [agentWalletPublicKey, protocolWalletPublicKey], payerPublicKey);
    const [agentATA, protocolATA] = atas;
    if (debug) {
        console.log(`   ATAs: ${summary.existed} existing, ${summary.created} to be created`);
    }
    // Add ATA creation instructions (if any)
    ataInstructions.forEach((instruction) => transaction.add(instruction));
    // Add USDC transfers
    const agentAmount = Math.floor(amountBase - protocolFeeBase);
    transaction.add((0, spl_token_1.createTransferInstruction)(payerATA, agentATA, payerPublicKey, agentAmount));
    transaction.add((0, spl_token_1.createTransferInstruction)(payerATA, protocolATA, payerPublicKey, Math.floor(protocolFeeBase)));
    if (debug) {
        console.log(`   Total: ${amountBase} base units`);
        console.log(`   Agent: ${agentAmount} base units`);
        console.log(`   Protocol: ${protocolFeeBase} base units`);
    }
    return { transaction, atasCreated: summary.created };
}
