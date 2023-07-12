import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useState } from "react";
import styles from "../styles/Home.module.css";
import { Button, Col, Form, Input, InputNumber, Row } from "antd";
import styled from "styled-components";
import { AnchorProvider } from "@project-serum/anchor";

type Props = {
  provider: AnchorProvider;
}
export const ProvideLiquidity: FC<Props> = () => {
  const [txSig, setTxSig] = useState("");
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const link = () => {
    return txSig
      ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
      : "";
  };

  const sendSol = (event) => {
    event.preventDefault();
    if (!connection || !publicKey) {
      return;
    }
    const transaction = new web3.Transaction();
    const recipientPubKey = new web3.PublicKey(event.target.recipient.value);

    const sendSolInstruction = web3.SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: recipientPubKey,
      lamports: LAMPORTS_PER_SOL * event.target.amount.value,
    });

    transaction.add(sendSolInstruction);
    sendTransaction(transaction, connection).then((sig) => {
      setTxSig(sig);
    });
  };

  const onFinish = (values: any) => {
    console.log("Success:", values);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Row justify="center">
      <Col offset={6} span={12}>
        <b>Constant Price: 1 SOL = 10 Move</b>
      </Col>
      <Col offset={6} span={12}>
        <ContainerForm
          layout="vertical"
          name="basic"
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Amount Move"
            name="move"
            rules={[{ required: true, message: "Please input amount Move!" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Please input amount Move"
            />
          </Form.Item>

          <Form.Item
            label="Amount SOL"
            name="sol"
            rules={[{ required: true, message: "Please input your amount!" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Please input amount SOL"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Liquid
            </Button>
          </Form.Item>
        </ContainerForm>
      </Col>
    </Row>
  );
};

const ContainerForm = styled(Form)`
  label {
    color: #fff !important;
  }
`;
