import { CronJob } from "cron";
import config from "../config";
import HeroV2 from "../model/Hero.v2";
import { client } from "../service/ApiClient";
import { logger } from "../utils/logger";
import { threadPool } from "../utils/parallel";
import { IBaseJob } from "./base.job";

const TIER_BASIC: any = {};
[16, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47].forEach((key) => {
  TIER_BASIC[key] = "Common";
});
[2, 3, 4, 5, 23, 25, 48, 50, 51, 52, 60, 64, 66, 68, 70, 71, 74].forEach(
  (key) => {
    TIER_BASIC[key] = "Epic";
  },
);
[
  1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 24, 26, 27, 28,
  29, 30, 31, 32, 33, 34, 35, 49, 53, 54, 55, 56, 57, 58, 59, 61, 62, 63, 65,
  67, 69, 72, 73,
].forEach((key) => {
  TIER_BASIC[key] = "Rare";
});

export class FillHeroDataJob implements IBaseJob {
  running: boolean;
  started: boolean;
  name: string;
  timePattern: string;
  cronJob: CronJob;
  constructor(timePattern: string) {
    this.timePattern = timePattern;
    this.name = "FillHeroDataJob";
  }
  process = async () => {
    const heroesNull = await HeroV2.findAll({
      where: { name: [null, ""] },
      limit: 10000,
    });
    logger.info(`${this.name} processing ${heroesNull.length} hero null data`);
    if (heroesNull.length <= 0) return;
    const beginTime = Date.now();

    const max = 50;
    for (let i = 0; i < heroesNull.length; i += max) {
      const heroes = heroesNull.slice(i, i + max);
      await threadPool(
        heroes,
        async (hero: any) => {
          try {
            const { token_id } = hero;
            let in_game_hero = (
              await client.get(`${config.INGAME_HERO_API}/heroes/${token_id}`)
            ).data;
            let externalData = null;
            if (in_game_hero?.externalUrl)
              externalData = (await client.get(in_game_hero.externalUrl)).data;
            const dataToUpdate = {
              hero_number: externalData?.HeroId,
              name: in_game_hero?.name,
              race: externalData?.Race,
              class: externalData?.Class,
              tier: hero.tier ? hero.tier : externalData?.Tier,
              tier_basic: hero.tier_basic
                ? hero.tier_basic
                : TIER_BASIC[externalData?.HeroId],
            };
            await HeroV2.update(dataToUpdate, { where: { id: hero.id } });
          } catch (error) {
            logger.error(`${this.name} tokenId - ${hero.token_id} -  ${error}`);
          }
        },
        50,
      );
    }

    const endTime = Date.now();
    logger.info(
      `${this.name} end process ${heroesNull.length} hero null data in ${
        (endTime - beginTime) / 1e3
      }s`,
    );
  };
  start() {
    if (!this.cronJob) {
      this.cronJob = new CronJob(this.timePattern, async () => {
        if (this.running) return;
        try {
          this.running = true;
          await this.process();
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
