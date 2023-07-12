import { createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { A_MINT, B_MINT, FEE_OWNER, POOL_MINT, SWAP_AUTHORITY } from ".";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

export const getPoolAccounts = async (): Promise<{ tokenFeeAccountAddress: PublicKey, tokenAAccountAddress: PublicKey, tokenBAccountAddress: PublicKey }> => {
  const tokenFeeAccountAddress = await getAssociatedTokenAddress(
    POOL_MINT,
    FEE_OWNER,
    true
  );
  const tokenAAccountAddress = await getAssociatedTokenAddress(
    A_MINT,
    SWAP_AUTHORITY,
    true
  );
  const tokenBAccountAddress = await getAssociatedTokenAddress(
    B_MINT,
    SWAP_AUTHORITY,
    true
  );
  return { tokenFeeAccountAddress, tokenAAccountAddress, tokenBAccountAddress };
}

export const getOrCreateAccount = async (connection: Connection, mint: PublicKey, owner: PublicKey, payer: PublicKey): Promise<[PublicKey, TransactionInstruction]> => {
  let tokenAccountAddress = await getAssociatedTokenAddress(
    mint,
    owner,
    true
  );
  const tokenAccountInstruction = createAssociatedTokenAccountInstruction(
    payer,
    tokenAccountAddress,
    owner,
    mint
  );
  try {
    // Check account created?
    await getAccount(connection, tokenAccountAddress);
    return [tokenAccountAddress, null];
  } catch (error) {
    return [tokenAccountAddress, tokenAccountInstruction];
  }
}