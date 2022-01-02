import HotWalletTransfer from "./HotWalletTransfer";
import MatchTransaction from "./MatchTransaction";
import Logs from "./Logs";
import HeroCheck from "./HeroCheck";
import Snapshot from "./Snapshot";
import PackageNFT from "./PackageNFT";
import HeroV2 from "./Hero.v2";
import TransferHero from "./TransferHero";
import Wallet from "./Wallet";
import AscendHistory from "./AscendHistory";
import { logger } from "../utils/logger";
import Gear from "./Gear";
import TransferGear from "./TransferGear";
export default {
  HotWalletTransfer,
  MatchTransaction,
  HeroCheck,
  Snapshot,
  PackageNFT,
  HeroV2,
  TransferHero,
  Wallet,
  AscendHistory,
  initModel: async () => {
    try {
      await TransferGear.sync();
      await Gear.sync();
      await HeroV2.sync();
      await MatchTransaction.sync();
      await Snapshot.sync();
      await HeroCheck.sync();
      await HotWalletTransfer.sync();
      await Logs.sync();
      await PackageNFT.sync();
      await TransferHero.sync();
      await Wallet.sync();
      await AscendHistory.sync();
    } catch (error) {
      logger.error(error);
    }
  },
};
