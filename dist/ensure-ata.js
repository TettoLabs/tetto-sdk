"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureATAExists = ensureATAExists;
exports.ensureMultipleATAsExist = ensureMultipleATAsExist;
const spl_token_1 = require("@solana/spl-token");
/**
 * Ensure ATA (Associated Token Account) exists for a given owner and mint
 * Returns the ATA address and an instruction to create it if it doesn't exist
 *
 * This prevents USDC transaction failures when recipient doesn't have a token account
 */
async function ensureATAExists(connection, mint, owner, payer) {
    const ata = await (0, spl_token_1.getAssociatedTokenAddress)(mint, owner);
    try {
        const accountInfo = await connection.getAccountInfo(ata);
        if (accountInfo) {
            return {
                ata,
                instruction: null,
                existed: true,
            };
        }
    }
    catch {
        // Account doesn't exist
    }
    const instruction = (0, spl_token_1.createAssociatedTokenAccountInstruction)(payer, ata, owner, mint);
    return {
        ata,
        instruction,
        existed: false,
    };
}
/**
 * Ensure multiple ATAs exist and return all instructions needed
 */
async function ensureMultipleATAsExist(connection, mint, owners, payer) {
    const atas = [];
    const instructions = [];
    let existed = 0;
    let created = 0;
    for (const owner of owners) {
        const result = await ensureATAExists(connection, mint, owner, payer);
        atas.push(result.ata);
        if (result.instruction) {
            instructions.push(result.instruction);
            created++;
        }
        else {
            existed++;
        }
    }
    return {
        atas,
        instructions,
        summary: {
            total: owners.length,
            existed,
            created,
        },
    };
}
