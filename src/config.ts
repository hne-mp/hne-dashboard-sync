import dotenv from "dotenv";
// import fs from "fs";
dotenv.config();
// const envConfig = dotenv.parse(
//   fs.readFileSync(process.env.OVERRIDE_ENV_FILE ?? ".env"),
// );
// for (const k in envConfig) {
//   process.env[k] = envConfig[k];
// }
export const maxParallel = Number(process.env.MAX_THREAD) ?? 5;
const config = {
  log: {
    dir: process.env.LOG_DIR ?? "../logs",
  },
  startBlock: Number(process.env.STARTBLOCK),
  gearStartBlock: Number(process.env.GEAR_START_BLOCK),
  rpc: process.env.RPC,
  maxQuery: Number(process.env.MAX_QUERY) ?? 500,
  connectionString: process.env.CONNECT_STRING,
  INGAME_HERO_API: process.env.INGAME_HERO_API,
  MARKETPLACE_API: process.env.MARKETPLACE_API,
  INGAME_QUERY_API: process.env.INGAME_QUERY_API,
  INGAME_QUERY_API_SECRET: process.env.INGAME_QUERY_API_SECRET,
  PLAYFAB: process.env.PLAYFAB ?? "http://localhost:5050",
  bot: {
    BOT_TOKEN: process.env.BOT_TOKEN,
    ALLOW_IDS: process.env.ALLOW_IDS ? JSON.parse(process.env.ALLOW_IDS) : [],
    SEND_TELEGRAM: process.env.SEND_TELEGRAM
      ? Boolean(process.env.SEND_TELEGRAM)
      : false,
  },
  CONTRACT: {
    MARKETPLACE_ADDRESS: process.env.MARKETPLACE_ADDRESS,
    PACK_NFT_CONTRACT_ADDRESS: process.env.PACK_NFT_CONTRACT_ADDRESS,
    HERO_NFT_ADDRESS: process.env.HERO_NFT_ADDRESS,
    HE_TOKEN_ADDRESS: process.env.HE_TOKEN_ADDRESS,
    GEAR_NFT_ADDRESS: process.env.GEAR_NFT_ADDRESS,
    GEAR_NFT_ASCEND_ADDRESS: process.env.GEAR_NFT_ASCEND_ADDRESS,
  },
  ADDRESS: {
    HOT_WALLET_ADDRESS: process.env.HOT_WALLET_ADDRESS,
    SPEND_FEE: process.env.SPEND_FEE, //spend fee in game -buy slot, clan ,...
  },
};
export default config;
