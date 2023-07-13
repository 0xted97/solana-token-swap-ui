import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
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
  SWAP_PROGRAM_ID,
} from "../configs";
import { getOrCreateAccount, getPoolAccounts } from "../configs/utils";
import {
  TOKEN_PROGRAM_ID,
  getMint,
  createApproveInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
} from "@solana/spl-token";

const { Option } = Select;

type Props = {
  provider: AnchorProvider;
};

export const Swap: FC<Props> = (props) => {
  const [txSig, setTxSig] = useState("");
  const [txInitial, setTxInitial] = useState("");
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const userTransferAuthority = web3.Keypair.fromSecretKey(
    new Uint8Array([
      140, 156, 18, 111, 11, 53, 77, 214, 83, 206, 110, 55, 223, 17, 100, 14,
      47, 216, 181, 141, 30, 173, 200, 8, 184, 158, 22, 217, 128, 99, 223, 150,
      6, 211, 207, 154, 3, 162, 205, 53, 197, 55, 11, 252, 140, 232, 238, 46,
      183, 251, 206, 253, 189, 22, 33, 144, 146, 140, 176, 5, 185, 196, 243,
      149,
    ])
  );

  const link = (hash: string) => {
    return `https://solscan.io/tx/${hash}?cluster=devnet`;
  };

  

  const getPoolAmount = async () => {
    const programId = new web3.PublicKey(SWAP_PROGRAM_ID);
    const program = new Program(IDL as Idl, programId, props?.provider);
    const ammInfo = await program.account.amm.fetch(AMM_ACCOUNT);
    const [aMint, bMint, swapTokenA, swapTokenB] = await Promise.all([
      getMint(connection, A_MINT),
      getMint(connection, B_MINT),
      getAccount(connection, new web3.PublicKey(ammInfo.tokenAAccount)),
      getAccount(connection, new web3.PublicKey(ammInfo.tokenBAccount)),
    ]);
    const liquidA = Number(swapTokenA.amount) / (10 ** aMint.decimals);
    const liquidB = Number(swapTokenB.amount) / (10 ** bMint.decimals);
  };

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

        const initial = await sendTransaction(transaction, connection, {
          preflightCommitment: "finalized",
        });
        setTxInitial(initial);

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
          .rpc();
        setTxSig(swapTx);
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

        const initial = await sendTransaction(transaction, connection, {
          preflightCommitment: "finalized",
        });
        setTxInitial(initial);

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
          .postInstructions([
            createCloseAccountInstruction(
              userBAccounts[0],
              publicKey,
              publicKey
            ),
          ])
          .rpc();
        setTxSig(swapTx);
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
      <Col offset={4} span={12}>
        <Button type="link" href={link(txInitial)} target="_blank">
          {txInitial}
        </Button>
        <Button type="link" href={link(txSig)} target="_blank">
          {txSig}
        </Button>
      </Col>
    </Row>
  );
};

const ContainerForm = styled(Form)`
  label {
    color: #fff !important;
  }
`;
