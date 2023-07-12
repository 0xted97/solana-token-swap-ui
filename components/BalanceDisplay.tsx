import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getMint,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Typography } from "antd";
import styled from "styled-components";

const { Title } = Typography;

export const BalanceDisplay: FC = () => {
  const MOVE_MINT = new PublicKey(process.env.A_MINT);

  const [balance, setBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const getBalanceToken = async () => {
    try {
      const account = getAssociatedTokenAddressSync(MOVE_MINT, publicKey);
      console.log(
        "🚀 ~ file: BalanceDisplay.tsx:24 ~ getBalanceToken ~ account:",
        account.toString()
      );
      const mint = await getMint(connection, MOVE_MINT);
      const { amount } = await getAccount(connection, account);
      setTokenBalance(Number(amount) / 10 ** mint.decimals);
    } catch (error) {
      setTokenBalance(0);
    }
  };

  const getBalance = async () => {
    connection.getAccountInfo(publicKey).then((info) => {
      setBalance(info.lamports / LAMPORTS_PER_SOL);
    });
  };

  useEffect(() => {
    if (!connection || !publicKey) {
      return;
    }

    getBalance();
    getBalanceToken();
  }, [connection, publicKey]);

  const renderBalance = () => {
    if (!connection || !publicKey) {
      return;
    }
    return <TitleCustom color="#FFF" level={3}>{`Balance SOL: ${balance}`}</TitleCustom>;
  };

  const renderTokenBalance = () => {
    if (!connection || !publicKey) {
      return;
    }
    return <TitleCustom level={3}>{`Balance Move: ${tokenBalance}`}</TitleCustom>;
  };

  return (
    <>
      {renderBalance()}
      {renderTokenBalance()}
    </>
  );
};

const TitleCustom = styled(Title)`
  color: #FFF !important;
`