import { SYSTEM_CONFIG_KEY } from "../constant";
import { ISystemConfig } from "../types/systemConfig";
import SnapshotService from "./Snapshot.service";
import defaultConfig from "../config";
import Snapshot from "../model/Snapshot";

class SystemConfigService {
  public static instance: ISystemConfig;
  public static async init() {
    if (!SystemConfigService.instance) {
      const snapshotService = new SnapshotService();
      let config;
      try {
        config = await snapshotService.getLatestSnapshot(SYSTEM_CONFIG_KEY);
      } catch (error) {}
      if (config) {
        SystemConfigService.instance = JSON.parse(config);
      } else {
        const newConfig: ISystemConfig = {
          boxNftTransferBlock: defaultConfig.startBlock,
          checkHeroDataBlock: defaultConfig.startBlock,
          heroTransferBlock: defaultConfig.startBlock,
          hotWalletBlock: defaultConfig.startBlock,
          mpMatchingBlock: defaultConfig.startBlock,
        };
        await Snapshot.create({
          key: SYSTEM_CONFIG_KEY,
          value: JSON.stringify(newConfig),
        });
        SystemConfigService.instance = newConfig;
      }
    }
  }

  public static async save() {
    await Snapshot.update(
      {
        key: SYSTEM_CONFIG_KEY,
        value: JSON.stringify(SystemConfigService.instance),
      },
      {
        where: { key: SYSTEM_CONFIG_KEY },
      },
    );
  }
}

export default SystemConfigService;
