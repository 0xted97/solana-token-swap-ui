import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import { AnchorProvider, BN, Idl, Program } from "@project-serum/anchor";
import {
  Button,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  notification,
} from "antd";
import styled from "styled-components";

import IDL from "../configs/solana_swap.json";
import {
  AMM_ACCOUNT,
  A_MINT,
  B_MINT,
  POOL_MINT,
  SWAP_AUTHORITY,
} from "../configs";
import { getOrCreateAccount, getPoolAccounts } from "../configs/utils";
import {
  TOKEN_PROGRAM_ID,
  getMint,
  createApproveInstruction,
} from "@solana/spl-token";

const { Option } = Select;

type Props = {
  provider: AnchorProvider;
};

export const Swap: FC<Props> = (props) => {
  const [txSig, setTxSig] = useState("");
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const userTransferAuthority = web3.Keypair.generate();

  const link = () => {
    return txSig
      ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
      : "";
  };

  useEffect(() => {}, []);

  const getPoolAmount = () => {};

  const swap = () => {
    event.preventDefault();
    if (!connection || !publicKey) {
      return;
    }
    const transaction = new web3.Transaction();
  };

  const onFinish = async (values: any) => {
    try {
      const programId = new web3.PublicKey(AMM_ACCOUNT);
      const program = new Program(IDL as Idl, programId, props?.provider);

      const { swapTo } = values;
      const poolAccounts = await getPoolAccounts();
      if (swapTo === "move") {
        const transaction = new web3.Transaction();
        const userAAccounts = await getOrCreateAccount(
          connection,
          A_MINT,
          publicKey,
          publicKey
        );
        if (userAAccounts[1]) transaction.add(userAAccounts[1]);
        const userBAccounts = await getOrCreateAccount(
          connection,
          B_MINT,
          publicKey,
          publicKey
        );
        if (userBAccounts[1]) transaction.add(userBAccounts[1]);

        const mint = await getMint(connection, B_MINT);
        console.log("🚀 ~ file: Swap.tsx:86 ~ onFinish ~ mint:", mint)
        const amount = Number(values.amount) * 10 ** mint.decimals;
        // Approve amount for userTransferAuthority
        const approveIx = createApproveInstruction(
          userBAccounts[0],
          userTransferAuthority.publicKey,
          publicKey,
          amount
        );
        transaction.add(approveIx);

        const swapTx = await program.methods
          .swap(new BN(amount), new BN(0))
          .accounts({
            swapAuthority: SWAP_AUTHORITY,
            amm: AMM_ACCOUNT,
            userTransferAuthority: userTransferAuthority.publicKey,
            sourceInfo: userBAccounts[0],
            destinationInfo: userAAccounts[0],
            swapSource: poolAccounts.tokenBAccountAddress,
            swapDestination: poolAccounts.tokenAAccountAddress,
            poolMint: POOL_MINT,
            feeAccount: poolAccounts.tokenFeeAccountAddress,
            tokenProgram: TOKEN_PROGRAM_ID,
            hostFeeAccount: web3.PublicKey.default,
          })
          .instruction();
        transaction.sign({
          publicKey: userTransferAuthority.publicKey,
          secretKey: userTransferAuthority.secretKey,
        });

        transaction.add(swapTx);
        const tran = await sendTransaction(transaction, connection);
        console.log("🚀 ~ file: Swap.tsx:115 ~ onFinish ~ tran:", tran);
      }
      if (swapTo === "sol") {
        const transaction = new web3.Transaction();

        const userAAccounts = await getOrCreateAccount(
          connection,
          A_MINT,
          publicKey,
          publicKey
        );
        if (userAAccounts[1]) transaction.add(userAAccounts[1]);
        const userBAccounts = await getOrCreateAccount(
          connection,
          B_MINT,
          publicKey,
          publicKey
        );
        if (userBAccounts[1]) transaction.add(userBAccounts[1]);

        const mint = await getMint(connection, A_MINT);
        const amount = Number(values.amount) * 10 ** mint.decimals;

        // Approve amount for userTransferAuthority
        const approveIx = createApproveInstruction(
          userAAccounts[0],
          userTransferAuthority.publicKey, // delegate
          publicKey,
          amount // amount, if your decimals is 8, 10^8 for 1 token
        );
        transaction.add(approveIx);
        const swapTx = await program.methods
          .swap(new BN(amount), new BN(0))
          .accounts({
            swapAuthority: SWAP_AUTHORITY,
            amm: AMM_ACCOUNT,
            userTransferAuthority: userTransferAuthority.publicKey,
            sourceInfo: userAAccounts[0],
            destinationInfo: userBAccounts[0],
            swapSource: poolAccounts.tokenAAccountAddress,
            swapDestination: poolAccounts.tokenBAccountAddress,
            poolMint: POOL_MINT,
            feeAccount: poolAccounts.tokenFeeAccountAddress,
            tokenProgram: TOKEN_PROGRAM_ID,
            hostFeeAccount: web3.PublicKey.default,
          })
          .instruction();
        transaction.sign({
          publicKey: userTransferAuthority.publicKey,
          secretKey: userTransferAuthority.secretKey,
        });

        transaction.add(swapTx);
        const tran = await sendTransaction(transaction, connection);
        console.log("🚀 ~ file: Swap.tsx:115 ~ onFinish ~ tran:", tran);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error?.message,
      });
    }
  };

  return (
    <Row justify="center">
      <Col offset={6} span={12}>
        <b>Constant Price: 1 SOL = 10 Move</b>
      </Col>
      <Col offset={6} span={12}>
        <ContainerForm
          layout="vertical"
          name="swap"
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Please input your amount!" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Please input amount amount"
            />
          </Form.Item>

          <Form.Item
            name="swapTo"
            label="Swap to"
            rules={[{ required: true, message: "Please swap to!" }]}
            initialValue="sol"
          >
            <Select placeholder="select asset">
              <Option value="sol">Sol</Option>
              <Option value="move">Move</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Swap
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
