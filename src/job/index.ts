import { CronJob } from "cron";
import config from "../config";
import SystemConfigService from "../service/SystemConfig.service";
import { IBaseJob } from "./base.job";
import { CheckInGameData } from "./checkHeroData.job";
import { FillHeroDataJob } from "./fillHeroData.job";
import { HeroTransferJob } from "./heroTransfer.job";
import { HeroTransferFixJob } from "./heroTransferFix.job";
import { HETransferDetect } from "./hotWallet.job";
import { MpMatchingTxJob } from "./mpMatchingTx.job";
import { PackageNftJob } from "./packageNft.job";
import { SnapshotJob } from "./snapshot.job";
import { UpdateSystemConfigJob } from "./updateSystemConfig.job";

export class Job {
  static jobs: Array<IBaseJob>;
  async init() {
    if (!Job.jobs || Job.jobs.length === 0) {
      Job.jobs = [];

      const transferJob = new HeroTransferJob(
        "HeroTransferJob",
        "*/6 * * * * *",
        () => SystemConfigService.instance.heroTransferBlock,
        (block) => {
          SystemConfigService.instance.heroTransferBlock = block;
        },
        config.maxQuery,
      );

      const checkHeroData = new CheckInGameData(
        "CheckInGameData",
        "*/6 * * * * *",
        () => SystemConfigService.instance.checkHeroDataBlock,
        (block) => {
          SystemConfigService.instance.checkHeroDataBlock = block;
        },
        config.maxQuery,
      );

      const heTransfer = new HETransferDetect(
        "HETransferDetect",
        "*/6 * * * * *",
        () => SystemConfigService.instance.hotWalletBlock,
        (block) => {
          SystemConfigService.instance.hotWalletBlock = block;
        },
        config.maxQuery,
      );

      const matchingTx = new MpMatchingTxJob(
        "MpMatchingTxJob",
        "*/6 * * * * *",
        () => SystemConfigService.instance.mpMatchingBlock,
        (block) => {
          SystemConfigService.instance.mpMatchingBlock = block;
        },
        config.maxQuery,
      );

      const packNftJob = new PackageNftJob(
        "PackageNftJob",
        "*/6 * * * * *",
        () => SystemConfigService.instance.boxNftTransferBlock,
        (block) => {
          SystemConfigService.instance.boxNftTransferBlock = block;
        },
        config.maxQuery,
      );

      const snapshot = new SnapshotJob("0 0 * * * *");
      const updateSystemConfigJob = new UpdateSystemConfigJob("*/6 * * * * *");
      // const fillHeroNullData = new FillHeroDataJob("0 */5 * * * *");

      Job.jobs.push(transferJob);
      Job.jobs.push(checkHeroData);
      Job.jobs.push(heTransfer);
      Job.jobs.push(matchingTx);
      Job.jobs.push(packNftJob);
      Job.jobs.push(snapshot);
      Job.jobs.push(updateSystemConfigJob);
      // Job.jobs.push(fillHeroNullData);

      // if (!SystemConfigService.instance.heroTransferFixBlock) {
      //   SystemConfigService.instance.heroTransferFixBlock = 12795377;
      // }
      // const heroFixData = new HeroTransferFixJob(
      //   "HeroFixDataJob",
      //   "*/3 * * * * *",
      //   () => SystemConfigService.instance.heroTransferFixBlock,
      //   config.maxQuery,
      // );
      // Job.jobs.push(heroFixData);
    }
  }
  updateSystemConfigJob: CronJob;
  startJob = () => {
    Job.jobs.forEach((job) => {
      job.start();
    });
  };
  stopJob = () => {
    Job.jobs.forEach((job) => {
      job.stop();
    });
  };
  static status = () => {
    const resp: any = {};
    Job.jobs.forEach((job) => {
      resp[job.name] = job.started ? "started" : "stopped";
    });
    return resp;
  };
}
