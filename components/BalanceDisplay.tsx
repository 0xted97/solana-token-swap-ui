import { FC } from "react";
import { Typography } from "antd";
import styled from "styled-components";

const { Title } = Typography;

type Props = {
  balance: number;
  balanceToken: number;
};
export const BalanceDisplay: FC<Props> = (props) => {
  const { balance, balanceToken } = props;

  const renderBalance = () => {
    return (
      <TitleCustom
        color="#FFF"
        level={3}
      >{`Balance SOL: ${balance}`}</TitleCustom>
    );
  };

  const renderTokenBalance = () => {
    return (
      <TitleCustom level={3}>{`Balance Move: ${balanceToken}`}</TitleCustom>
    );
  };

  return (
    <>
      {renderBalance()}
      {renderTokenBalance()}
    </>
  );
};

const TitleCustom = styled(Title)`
  color: #fff !important;
`;
