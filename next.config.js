/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  env: {
    SWAP_PROGRAM_ID:"9CcZgrQxu4UE72Z7DqFxoGxkhicvqKNWmNbThtPRz62a",
    SWAP_AUTHORITY: "EKJnEFWGPmkeGZzWEH9dqCY7WE35hBJgjdj3Ni7aNCkx",
    AMM_ACCOUNT: "AmmfCddqsSFYvyrsXYSYmvEQzStUg4Vi74ZJoSkdDsvC",
    POOL_MINT: "LPT41r7miPn1yce9n9iLS45tfaxhPQcETZgqFSVTTMp",
    A_MINT: "To9y3LHENHDU4tU78ockkSZwVuxfvtgbSKPjqjXrNYt",
    B_MINT: "So11111111111111111111111111111111111111112",
    FEE_OWNER: "HfoTxFR1Tm6kGmWgYWD6J7YHVy1UwqSULUGVLXkJqaKN",
  },
}

module.exports = nextConfig
