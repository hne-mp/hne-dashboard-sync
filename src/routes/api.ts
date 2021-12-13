import { TOPICS } from "../constant";
import { getWeb3 } from "../contract/contract";
import HotWalletTransfer from "../model/HotWalletTransfer";
import HeroCheckService from "../service/HeroCheck.service";
import { hotWalletBalance } from "../service/HotWallet.service";
import { logger } from "../utils/logger";
import IngameService from "../service/Ingame.service";
import { updateOrCreate } from "../service/Common.service";
import Snapshot from "../model/Snapshot";
import { snapshotKey } from "../service/Snapshot.service";
import { timestampToDBQuery } from "../utils";
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
router.get("/fill-null", async function (req: any, res: any, next: any) {
  try {
    const heroCheckService = new HeroCheckService();
    await heroCheckService.fillNull();
    res.status(200).send();
  } catch (error) {
    logger.error(error);
    res.status(500).send();
  }
});
router.get("/detect-spend-fee", async function (req: any, res: any, next: any) {
  try {
    const web = getWeb3();
    const rows: any[] = await HotWalletTransfer.findAll({
      where: {
        type: "SPEND_FEE",
      },
    });
    for (let i in rows) {
      const row = rows[i];
      const tx_receipt = await web.eth.getTransactionReceipt(row.tx_hash);
      const latestLog = tx_receipt.logs[tx_receipt.logs.length - 1];
      let type;
      if (latestLog.topics[0] === TOPICS.SUMMON) {
        type = "SUMMON";
      } else if (latestLog.topics[0] === TOPICS.LIMIT_BREAK) {
        type = "LIMIT_BREAK";
      } else if (latestLog.topics[0] === TOPICS.DEPOSIT) {
        type = "DEPOSIT";
      } else if (latestLog.topics[0] === TOPICS.BUY_SLOT) {
        type = "BUY_SLOT";
      } else if (latestLog.topics[0] === TOPICS.CLAN_MAP) {
        type = "CLAN_MAP";
      } else if (latestLog.topics[0] === TOPICS.EDIT_NAME) {
        type = "EDIT_NAME";
      } else if (latestLog.topics[0] === TOPICS.PURCHASE_ITEM_DUNGEON) {
        type = "PURCHASE_ITEM_DUNGEON";
      } else if (latestLog.topics[0] === TOPICS.REQUEST_HERO) {
        type = "REQUEST_HERO";
      } else if (latestLog.topics[0] === TOPICS.UNION_BLESSING) {
        type = "UNION_BLESSING";
      } else type = "SPEND_FEE";
      row.type = type;
      await row.save();
    }
    res.status(200).send();
  } catch (error) {
    logger.error(error);
    res.status(500).send();
  }
});

router.get("/snapShotInGame", async function (req: any, res: any, next: any) {
  try {
    const { from, to } = req.query;
    const spend = await IngameService.heSpend(from, to);
    const earn = await IngameService.heEarn(from, to);
    for (let s of spend.Rows) {
      await updateOrCreate(
        Snapshot,
        {
          group: snapshotKey.SPEND_HE_INGAME,
          key: s.context + "_spend",
          createdAt: new Date(s.date.value),
        },
        {
          group: snapshotKey.SPEND_HE_INGAME,
          key: s.context + "_spend",
          createdAt: new Date(s.date.value),
          value: s.spend,
        },
      );
      await updateOrCreate(
        Snapshot,
        {
          group: snapshotKey.SPEND_HE_INGAME,
          key: s.context + "_times",
          createdAt: new Date(s.date.value),
        },
        {
          group: snapshotKey.SPEND_HE_INGAME,
          key: s.context + "_times",
          createdAt: new Date(s.date.value),
          value: s.times,
        },
      );
    }
    for (let s of earn.Rows) {
      await updateOrCreate(
        Snapshot,
        {
          group: snapshotKey.EARN_HE_INGAME,
          key: s.context + "_earn",
          createdAt: new Date(s.date.value),
        },
        {
          group: snapshotKey.EARN_HE_INGAME,
          key: s.context + "_earn",
          createdAt: new Date(s.date.value),
          value: s.earn,
        },
      );
      await updateOrCreate(
        Snapshot,
        {
          group: snapshotKey.EARN_HE_INGAME,
          key: s.context + "_events",
          createdAt: new Date(s.date.value),
        },
        {
          group: snapshotKey.EARN_HE_INGAME,
          key: s.context + "_events",
          createdAt: new Date(s.date.value),
          value: s.events,
        },
      );
    }

    res.status(200).send();
  } catch (error) {
    logger.error(error);
    res.status(500).send();
  }
});

export default router;
