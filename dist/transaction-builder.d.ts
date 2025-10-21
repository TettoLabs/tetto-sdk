import { Connection, PublicKey, Transaction } from "@solana/web3.js";
export interface BuildPaymentTransactionParams {
    connection: Connection;
    payerPublicKey: PublicKey;
    agentWalletPublicKey: PublicKey;
    protocolWalletPublicKey: PublicKey;
    amountBase: number;
    protocolFeeBase: number;
    tokenMint: string;
    tokenDecimals: number;
    debug?: boolean;
}
export declare function buildAgentPaymentTransaction(params: BuildPaymentTransactionParams): Promise<{
    transaction: Transaction;
    atasCreated: number;
}>;
