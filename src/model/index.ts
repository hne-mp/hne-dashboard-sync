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
    } catch (error) {
      logger.error(error);
    }
    try {
      await Gear.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await HeroV2.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await MatchTransaction.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await Snapshot.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await HeroCheck.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await HotWalletTransfer.sync();
    } catch (error) {
      logger.error(error);
    }

    try {
      await Logs.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await PackageNFT.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await TransferHero.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await Wallet.sync();
    } catch (error) {
      logger.error(error);
    }
    try {
      await AscendHistory.sync();
    } catch (error) {
      logger.error(error);
    }
  },
};
