import { hotWalletBalance } from "../service/HotWallet.service";
import { logger } from "../utils/logger";
var express = require("express");
var router = express.Router();

router.get(
  "/hot-wallet-balance",
  async function (req: any, res: any, next: any) {
    try {
      const { balanceHE, balanceBNB } = await hotWalletBalance();
      res.json({ balanceHE, balanceBNB, timestamp: new Date() });
    } catch (error) {
      logger.error(error);
      res.status(500).send();
    }
  },
);

export default router;
