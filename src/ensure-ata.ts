import {
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

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
export async function ensureATAExists(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey
): Promise<EnsureATAResult> {
  const ata = await getAssociatedTokenAddress(mint, owner);

  try {
    const accountInfo = await connection.getAccountInfo(ata);

    if (accountInfo) {
      return {
        ata,
        instruction: null,
        existed: true,
      };
    }
  } catch {
    // Account doesn't exist
  }

  const instruction = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    owner,
    mint
  );

  return {
    ata,
    instruction,
    existed: false,
  };
}

/**
 * Ensure multiple ATAs exist and return all instructions needed
 */
export async function ensureMultipleATAsExist(
  connection: Connection,
  mint: PublicKey,
  owners: PublicKey[],
  payer: PublicKey
): Promise<{
  atas: PublicKey[];
  instructions: TransactionInstruction[];
  summary: { total: number; existed: number; created: number };
}> {
  const atas: PublicKey[] = [];
  const instructions: TransactionInstruction[] = [];
  let existed = 0;
  let created = 0;

  for (const owner of owners) {
    const result = await ensureATAExists(connection, mint, owner, payer);
    atas.push(result.ata);

    if (result.instruction) {
      instructions.push(result.instruction);
      created++;
    } else {
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
