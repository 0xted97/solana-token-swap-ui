import { web3 } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export const SWAP_PROGRAM_ID = new PublicKey(process.env.SWAP_PROGRAM_ID);
export const AMM_ACCOUNT = new PublicKey(process.env.AMM_ACCOUNT);
export const SWAP_AUTHORITY = new PublicKey(process.env.SWAP_AUTHORITY);
export const POOL_MINT = new PublicKey(process.env.POOL_MINT);
export const FEE_OWNER = new PublicKey(process.env.FEE_OWNER);
export const A_MINT = new PublicKey(process.env.A_MINT);
export const B_MINT = new PublicKey(process.env.B_MINT);


// Should be new generate each req
export const userTransferAuthority = web3.Keypair.fromSecretKey(
    new Uint8Array([
        140, 156, 18, 111, 11, 53, 77, 214, 83, 206, 110, 55, 223, 17, 100, 14,
        47, 216, 181, 141, 30, 173, 200, 8, 184, 158, 22, 217, 128, 99, 223, 150,
        6, 211, 207, 154, 3, 162, 205, 53, 197, 55, 11, 252, 140, 232, 238, 46,
        183, 251, 206, 253, 189, 22, 33, 144, 146, 140, 176, 5, 185, 196, 243,
        149,
    ])
);