import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { FC, useEffect, useMemo, useState } from "react";
import { Button, Col, Form, InputNumber, Row, notification } from "antd";
import styled from "styled-components";
import { debounce } from "lodash";
import {
  TOKEN_PROGRAM_ID,
  createApproveInstruction,
  createSyncNativeInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { AnchorProvider, BN, Idl, Program } from "@project-serum/anchor";
import { getOrCreateAccount, getPoolAccounts } from "../configs/utils";
import {
  AMM_ACCOUNT,
  A_MINT,
  B_MINT,
  POOL_MINT,
  SWAP_AUTHORITY,
  SWAP_PROGRAM_ID,
  userTransferAuthority,
} from "../configs";
import IDL from "../configs/solana_swap.json";

type Props = {
  provider: AnchorProvider;
  onCallback: (hash: string) => void;
};
export const ProvideLiquidity: FC<Props> = (props) => {
  const [poolTokenAmount, setPoolTokenAmount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [moveEst, setMoveEst] = useState(0);
  const [solEst, setSolEst] = useState(0);
  const [form] = Form.useForm();
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  

  const calculateAmountB = async (aAmount: number) => {
    const bAmount = aAmount * 0.1; // Constant Price 10A = 1B
    const poolAccounts = await getPoolAccounts();
    const [poolMint, aMint, bMint, poolAmountA, poolAmountB] =
      await Promise.all([
        getMint(connection, POOL_MINT),
        getMint(connection, A_MINT),
        getMint(connection, B_MINT),
        getAccount(
          connection,
          new web3.PublicKey(poolAccounts.tokenAAccountAddress)
        ),
        getAccount(
          connection,
          new web3.PublicKey(poolAccounts.tokenBAccountAddress)
        ),
      ]);
    const poolReserveTokenA = Number(poolAmountA.amount) / 10 ** aMint.decimals;
    const poolReserveTokenB = Number(poolAmountB.amount) / 10 ** bMint.decimals;
    const totalSupplyLPTokens =
      Number(poolMint.supply) / 10 ** poolMint.decimals;

    const liquidityRatioTokenA = aAmount / poolReserveTokenA;
    const liquidityRatioTokenB = bAmount / poolReserveTokenB;

    const liquidityRatio = Math.min(liquidityRatioTokenA, liquidityRatioTokenB);
    // Calculate the amount of LP tokens to be minted for the user
    const lpTokenAmount = liquidityRatio * totalSupplyLPTokens;

    form.setFieldsValue({
      sol: bAmount,
    });

    setMoveEst(aAmount);
    setSolEst(bAmount);
    setPoolTokenAmount(lpTokenAmount);
  };

  const debouncedResults = useMemo(() => {
    return debounce(calculateAmountB, 1000);
  }, [calculateAmountB]);

  useEffect(() => {
    return () => {
      debouncedResults.cancel();
    };
  });

  const onFinish = async (values: any) => {
    const defaultSlippage = 0; // Should be modify by user

    const programId = new web3.PublicKey(SWAP_PROGRAM_ID);
    const program = new Program(IDL as Idl, programId, props?.provider);
    const poolAccounts = await getPoolAccounts();

    try {
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
      const aMint = await getMint(connection, A_MINT);
      const bMint = await getMint(connection, B_MINT);
      const poolMint = await getMint(connection, POOL_MINT);

      const poolAmountInDecimal =
        Number(poolTokenAmount.toFixed(3)) * 10 ** poolMint.decimals;
      const moveAmountInDecimal =
        Number((moveEst + defaultSlippage * moveEst).toFixed(3)) *
        10 ** aMint.decimals;
      const solAmountInDecimal =
        Number((solEst + defaultSlippage * solEst).toFixed(3)) *
          10 ** bMint.decimals
      // Transfer Sol
      transaction.add(
        web3.SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: userBAccounts[0],
          lamports: solAmountInDecimal,
        }),
        createSyncNativeInstruction(userBAccounts[0])
      );

      // Approve amount for userTransferAuthority
      transaction.add(
        createApproveInstruction(
          userAAccounts[0],
          userTransferAuthority.publicKey,
          publicKey,
          moveAmountInDecimal
        ),
        createApproveInstruction(
          userBAccounts[0],
          userTransferAuthority.publicKey,
          publicKey,
          solAmountInDecimal
        )
      );
      setLoading(true);
      const depositTx = await program.methods
        .depositAllTokenTypes(
          new BN(poolAmountInDecimal),
          new BN(moveAmountInDecimal),
          new BN(solAmountInDecimal)
        )
        .accounts({
          amm: AMM_ACCOUNT,
          swapAuthority: SWAP_AUTHORITY,
          userTransferAuthorityInfo: userTransferAuthority.publicKey,
          sourceAInfo: userAAccounts[0],
          sourceBInfo: userBAccounts[0],
          tokenAAccount: poolAccounts.tokenAAccountAddress,
          tokenBAccount: poolAccounts.tokenBAccountAddress,
          poolMint: POOL_MINT,
          destination: poolAccounts.tokenFeeAccountAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([userTransferAuthority])
        .preInstructions(transaction.instructions)
        .rpc();
      if (props.onCallback && typeof props.onCallback === "function")
        props.onCallback(depositTx);
      setLoading(false);
    } catch (error) {
      notification.error({
        message: "Error",
        description: error?.message || "Unknown error",
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
          form={form}
          layout="vertical"
          name="basic"
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Amount Move"
            name="move"
            rules={[{ required: true, message: "Please input amount Move!" }]}
          >
            <InputNumber
              name="move"
              style={{ width: "100%" }}
              placeholder="Please input amount Move"
              onChange={(value) => {
                debouncedResults(Number(value))
              }}
            />
          </Form.Item>

          <Form.Item label="Amount SOL" name="sol">
            <InputNumber
              style={{ width: "100%", color: "#FFF" }}
              value={solEst}
              disabled
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
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
