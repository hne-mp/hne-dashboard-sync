import { CronJob } from "cron";
import { getWeb3 } from "../contract/contract";
import { logger } from "../utils/logger";

export interface IBaseJob {
  start: () => void;
  stop: () => void;
  running: boolean;
  started: boolean;
  name: string;
  timePattern: string;
  cronJob: CronJob;
}

export class BaseJob implements IBaseJob {
  timePattern: string;
  cronJob: CronJob;
  latestBlock: () => number;
  setLatestBlock: (latest: number) => void;
  running: boolean;
  maxQuery: number;
  name: string;
  started: boolean;
  process: (fromBlock: number, toBlock: number) => Promise<any>;
  constructor(
    name: string,
    timePattern: string,
    latestBlock: () => number,
    setLatestBlock: (latest: number) => void,
    maxQuery: number,
  ) {
    this.timePattern = timePattern;
    this.maxQuery = maxQuery;
    this.latestBlock = latestBlock;
    this.running = false;
    this.started = false;
    this.name = name;
    this.setLatestBlock = setLatestBlock;
  }
  detect = async () => {
    if (this.running) return;
    this.running = true;
    try {
      let blockchain_height = (await getWeb3().eth.getBlockNumber()) - 10;
      let latest = this.latestBlock();
      let toBlock: any = latest;
      while (latest <= blockchain_height && toBlock !== "latest") {
        const fromBlock = latest;
        toBlock =
          blockchain_height - latest >= this.maxQuery
            ? latest + this.maxQuery
            : "latest";
        await this.process(fromBlock, toBlock);
        latest = toBlock === "latest" ? this.latestBlock() : toBlock;
        // if (latest === fromBlock) this.setLatestBlock(this.latestBlock() + 1);
      }
    } catch (error) {
      logger.error(`${this.name} error ${error.message}`);
      throw error;
    } finally {
      this.running = false;
    }
  };
  start() {
    if (!this.cronJob) {
      this.cronJob = new CronJob(this.timePattern, async () => {
        try {
          await this.detect();
        } catch (error) {
          logger.error(error);
        }
      });
    }
    if (this.cronJob.running) {
      logger.info(`${this.name} running. Nothing todo.`);
    } else {
      this.cronJob.start();
      logger.info(`${this.name} started`);
    }
    this.started = true;
  }
  stop() {
    if (this.cronJob && !this.cronJob.running) {
      this.cronJob.stop();
    }
    logger.info(`${this.name} stopped`);
  }
}
