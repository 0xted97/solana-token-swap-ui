import { NextPage } from "next";
import styles from "../styles/Home.module.css";
import { AppBar } from "../components/AppBar";
import { BalanceDisplay } from "../components/BalanceDisplay";
import { ProvideLiquidity } from "../components/ProvideLiquidity";
import { Swap } from "../components/Swap";
import Head from "next/head";
import { Col, Row, Tabs, Typography } from "antd";
import type { TabsProps } from "antd";
import { useEffect, useState } from "react";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  AnchorProvider,
  Idl,
  Program,
  setProvider,
  web3,
} from "@project-serum/anchor";
import { AMM_ACCOUNT, A_MINT, B_MINT, SWAP_PROGRAM_ID } from "../configs";
import IDL from "../configs/solana_swap.json";
import { getAccount, getMint } from "@solana/spl-token";

const Home: NextPage = (props) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const provider = new AnchorProvider(connection, wallet, {});

  const [liquidA, setLiquidA] = useState(0);
  const [liquidB, setLiquidB] = useState(0);
  setProvider(provider);

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `Provide liquidity`,
      children: <ProvideLiquidity provider={provider} />,
    },
    {
      key: "2",
      label: `Swap`,
      children: <Swap provider={provider} />,
    },
  ];

  const [tab, setTab] = useState("1");
  const onChangeTab = (key: string) => {
    setTab(key);
  };

  useEffect(() => {
    getPoolAmount();
  }, []);

  const getPoolAmount = async () => {
    try {
      const programId = new web3.PublicKey(SWAP_PROGRAM_ID);
      const program = new Program(IDL as Idl, programId, provider);
      const ammInfo = await program.account.amm.fetch(AMM_ACCOUNT);
      const [aMint, bMint, swapTokenA, swapTokenB] = await Promise.all([
        getMint(connection, A_MINT),
        getMint(connection, B_MINT),
        getAccount(connection, new web3.PublicKey(ammInfo.tokenAAccount)),
        getAccount(connection, new web3.PublicKey(ammInfo.tokenBAccount)),
      ]);
      const liquidA = Number(swapTokenA.amount) / 10 ** aMint.decimals;
      const liquidB = Number(swapTokenB.amount) / 10 ** bMint.decimals;
      setLiquidA(liquidA);
      setLiquidB(liquidB);
    } catch (error) {
      setLiquidA(0);
      setLiquidB(0);
    }
  };

  return (
    <div className={styles.App}>
      <Head>
        <title>Solana swap SOL-MOVE</title>
        <meta name="description" content="Solana swap SOL-MOVE" />
      </Head>
      <AppBar />
      {publicKey && (
        <Row gutter={16}>
          <Col span={24} className={styles.AppBody}>
            <BalanceDisplay />
            <h4>Liquid Move: {liquidA}</h4>
            <h4>Liquid SOL: {liquidB}</h4>
          </Col>
          <Col span={24}>
            <Tabs
              centered
              type="card"
              size="large"
              style={{
                color: "#FFF",
              }}
              activeKey={tab}
              items={items}
              onChange={onChangeTab}
            />
          </Col>
        </Row>
      )}
      {!publicKey && (
        <Typography.Title style={{ color: "#FFF" }} level={1}>
          Please connect wallet
        </Typography.Title>
      )}
    </div>
  );
};

export default Home;
