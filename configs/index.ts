import { PublicKey } from "@solana/web3.js";

export const SWAP_PROGRAM_ID = new PublicKey(process.env.SWAP_PROGRAM_ID);
export const AMM_ACCOUNT = new PublicKey(process.env.AMM_ACCOUNT);
export const SWAP_AUTHORITY = new PublicKey(process.env.SWAP_AUTHORITY);
export const POOL_MINT = new PublicKey(process.env.POOL_MINT);
export const FEE_OWNER = new PublicKey(process.env.FEE_OWNER);
export const A_MINT = new PublicKey(process.env.A_MINT);
export const B_MINT = new PublicKey(process.env.B_MINT);