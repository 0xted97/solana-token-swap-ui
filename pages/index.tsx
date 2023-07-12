import { NextPage } from "next";
import styles from "../styles/Home.module.css";
import { AppBar } from "../components/AppBar";
import { BalanceDisplay } from "../components/BalanceDisplay";
import { ProvideLiquidity } from "../components/ProvideLiquidity";
import { Swap } from "../components/Swap";
import Head from "next/head";
import { Col, Row, Tabs, Typography } from "antd";
import type { TabsProps } from "antd";
import { useState } from "react";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { AnchorProvider, setProvider } from "@project-serum/anchor";

const Home: NextPage = (props) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const provider = new AnchorProvider(connection, wallet, {});
  setProvider(provider)

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
