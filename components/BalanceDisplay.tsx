import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAccount, createAssociatedTokenAccountInstruction ,getAssociatedTokenAddressSync } from "@solana/spl-token";

export const BalanceDisplay: FC = () => {
  const MOVE_MINT = new PublicKey(process.env.MOVE_TOKEN_MINT);

  const [balance, setBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const getBalanceToken = async ()=>{
    const account = getAssociatedTokenAddressSync(MOVE_MINT, publicKey);
    // const ix = createAssociatedTokenAccountInstruction(publicKey, account, publicKey, MOVE_MINT);
    // // sendTransaction(new Transaction().add(ix),connection)
    const balance = await getAccount(connection, account);
  }
  useEffect(() => {
    if (!connection || !publicKey) {
      return;
    }

    connection.getAccountInfo(publicKey).then((info) => {
      setBalance(info.lamports);
    });
    getBalanceToken();
  }, [connection, publicKey]);

  return (
    <div>
      <p>{publicKey ? `Balance: ${balance / LAMPORTS_PER_SOL}` : ""}</p>
    </div>
  );
};
