import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
export interface EnsureATAResult {
    ata: PublicKey;
    instruction: TransactionInstruction | null;
    existed: boolean;
}
/**
 * Ensure ATA (Associated Token Account) exists for a given owner and mint
 * Returns the ATA address and an instruction to create it if it doesn't exist
 *
 * This prevents USDC transaction failures when recipient doesn't have a token account
 */
export declare function ensureATAExists(connection: Connection, mint: PublicKey, owner: PublicKey, payer: PublicKey): Promise<EnsureATAResult>;
/**
 * Ensure multiple ATAs exist and return all instructions needed
 */
export declare function ensureMultipleATAsExist(connection: Connection, mint: PublicKey, owners: PublicKey[], payer: PublicKey): Promise<{
    atas: PublicKey[];
    instructions: TransactionInstruction[];
    summary: {
        total: number;
        existed: number;
        created: number;
    };
}>;
