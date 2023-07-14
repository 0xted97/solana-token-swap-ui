import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { FC, useState } from "react";
import { AnchorProvider, BN, Idl, Program } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  getMint,
  createApproveInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
} from "@solana/spl-token";
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
  SWAP_PROGRAM_ID,
  userTransferAuthority,
} from "../configs";
import { getOrCreateAccount, getPoolAccounts } from "../configs/utils";

const { Option } = Select;

type Props = {
  provider: AnchorProvider;
  onCallback: (hash: string) => void;
};

export const Swap: FC<Props> = (props) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [swapTo, setSwapTo] = useState("sol");

  const onFinish = async (values: any) => {
    try {
      const programId = new web3.PublicKey(SWAP_PROGRAM_ID);
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
        const amount = Number(values.amount) * 10 ** mint.decimals;

        // Wrap SOL -> WSOL
        transaction.add(
          web3.SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: userBAccounts[0],
            lamports: amount,
          }),
          createSyncNativeInstruction(userBAccounts[0])
        );

        // Approve amount for userTransferAuthority
        const approveIx = createApproveInstruction(
          userBAccounts[0],
          userTransferAuthority.publicKey,
          publicKey,
          amount
        );
        transaction.add(approveIx);

        // const initial = await sendTransaction(transaction, connection, {
        //   preflightCommitment: "finalized",
        // });
        // setTxInitial(initial);
        setLoading(true);
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
          .signers([userTransferAuthority])
          .preInstructions(transaction.instructions)
          .rpc();
        if (props.onCallback && typeof props.onCallback === "function")
          props.onCallback(swapTx);
        setLoading(false);
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
          amount
        );
        transaction.add(approveIx);
        setLoading(true);
        const swapTx = await program.methods
          .swap(new BN(amount), new BN(0))
          .accounts({
            amm: AMM_ACCOUNT,
            swapAuthority: SWAP_AUTHORITY,
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
          .signers([userTransferAuthority])
          .preInstructions(transaction.instructions)
          .postInstructions([
            createCloseAccountInstruction(
              userBAccounts[0],
              publicKey,
              publicKey
            ),
          ])
          .rpc();
        if (props.onCallback && typeof props.onCallback === "function")
          props.onCallback(swapTx);
        setLoading(false);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error?.message,
      });
      setLoading(false);
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
            label={`Amount (${swapTo === "sol" ? "move" : "sol"})`}
            name="amount"
            rules={[{ required: true, message: "Please input your amount!" }]}
            initialValue={"0.0002"}
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
            <Select
              placeholder="select asset"
              onChange={(value) => setSwapTo(value)}
            >
              <Option value="sol">Sol</Option>
              <Option value="move">Move</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
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
