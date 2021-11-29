import { CronJob } from "cron";
import SystemConfigService from "../service/SystemConfig.service";
import { logger } from "../utils/logger";
import { IBaseJob } from "./base.job";

export class UpdateSystemConfigJob implements IBaseJob {
  running: boolean;
  started: boolean;
  name: string;
  timePattern: string;
  cronJob: CronJob;
  constructor(timePattern: string) {
    this.timePattern = timePattern;
    this.name = "UpdateSystemConfigJob";
  }
  start() {
    if (!this.cronJob) {
      this.cronJob = new CronJob(this.timePattern, async () => {
        if (this.running) return;
        try {
          this.running = true;
          await SystemConfigService.save();
        } catch (error) {
          logger.error(error);
        } finally {
          this.running = false;
        }
      });
    }
    if (!this.cronJob.running) {
      this.cronJob.start();
      this.started = true;
    }
    logger.info(`${this.name} started`);
  }
  stop() {
    if (this.cronJob && !this.cronJob.running) {
      this.cronJob.stop();
    }
    logger.info(`${this.name} stopped`);
  }
}
