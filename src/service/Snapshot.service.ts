import connection from "../DBConnect";
import model from "../model";
import Snapshot from "../model/Snapshot";
import { QueryTypes } from "sequelize";
import axios from "axios";
import config from "../config";
import { BURN_ADDRESS } from "../constant";
import { logger } from "../utils/logger";
import IngameService from "./Ingame.service";
import { updateOrCreate } from "./Common.service";

const { MatchTransaction, HotWalletTransfer, PackageNFT, TransferHero } = model;

export const snapshotKey = {
  MARKETPLACE_MATCHING_TX: "MARKETPLACE_MATCHING_TX",
  MARKETPLACE_MATCHING_VALUE: "MARKETPLACE_MATCHING_VALUE",
  MARKETPLACE_MATCHING_REVENUE: "MARKETPLACE_MATCHING_REVENUE",
  HERO_ISSUED_TX: "HERO_ISSUED_TX",
  HERO_ISSUED_FEE: "HERO_ISSUED_FEE",
  TOTAL_USER: "TOTAL_USER",
  TOTAL_HOLDER: "TOTAL_HOLDER",
  TOTAL_HERO_ISSUED: "TOTAL_HERO_ISSUED",
  TOTAL_HERO_BURNED: "TOTAL_HERO_BURNED",
  HERO: "HERO",
  HERO_CLASS: "HERO_CLASS",
  HERO_TIER: "HERO_TIER",
  HERO_RACE: "HERO_RACE",
  MARKETPLACE_LISTING_ITEMS: "MARKETPLACE_LISTING_ITEMS",
  MARKETPLACE_LISTING_VOLUME: "MARKETPLACE_LISTING_VOLUME",
  MARKETPLACE_TOTAL_USER: "MARKETPLACE_TOTAL_USER",
  PACKAGE_NFT_TOTAL_BURNED: "PACKAGE_NFT_TOTAL_BURNED",
  PACKAGE_NFT_TOTAL_ISSUED: "PACKAGE_NFT_TOTAL_ISSUED",
  SUMMON: "SUMMON",
  LIMIT_BREAK: "LIMIT_BREAK",
  SPEND_FEE: "SPEND_FEE",
  HOTWALLET: "HOTWALLET",
  USER_SPEND: "USER_SPEND",
  PLAYFAB_TOTAL_USER: "PLAYFAB_TOTAL_USER",
  PLAYFAB_DAILY_ACTIVE: "PLAYFAB_DAILY_ACTIVE",
  PLAYFAB_HE_INGAME: "PLAYFAB_HE_INGAME",
  SPEND_HE_INGAME: "SPEND_HE_INGAME_V2",
  EARN_HE_INGAME: "EARN_HE_INGAME_V2",
};

class SnapshotService {
  /**
   *
   * @param {array of key} keys
   * @returns array rows
   */
  async getLatestSnapshot(key: string) {
    const result: any[] = await connection.query(
      `select  value from "Snapshots" where 
        "createdAt"  =
        (select max("createdAt") as time 
        from "Snapshots" s where "key"  =  '${key}' )
        and  "key" = '${key}' ;`,
      { type: QueryTypes.SELECT },
    );
    return result[0].value;
  }

  /**
   *
   * @param {*} key
   * @param {*} from
   * @param {*} to
   * @returns
   */
  async getSnapshotRange(
    key: string,
    from: string,
    to: string,
    timeGroup = "hour",
  ) {
    const result = await connection.query(
      `select value,date_trunc('${timeGroup}',"createdAt") as  time  from "Snapshots" where "key" = '${key}' and "createdAt"  in 
      (select a."createdAt" from (select  max("createdAt") as "createdAt" ,date_trunc('${timeGroup}',"createdAt") as "time" 
      from "Snapshots" s where "key"  = '${key}' and "createdAt" between '${from}' and '${to}'
       group by "time" ) a) order by time desc`,
      { type: QueryTypes.SELECT },
    );
    return result;
  }
  /**
   * TODO marketplace sell hero
   * matching tx
   * matching value
   * revenue
   */
  async update_marketplace_matching_tx() {
    const [total_tx, total_value, revenue] = await Promise.all([
      MatchTransaction.count(),
      MatchTransaction.sum("price"),
      MatchTransaction.sum("market_fee"),
    ]);
    await Snapshot.bulkCreate([
      {
        key: snapshotKey.MARKETPLACE_MATCHING_TX,
        value: total_tx,
      },
      {
        key: snapshotKey.MARKETPLACE_MATCHING_VALUE,
        value: total_value,
      },
      {
        key: snapshotKey.MARKETPLACE_MATCHING_REVENUE,
        value: revenue,
      },
    ]);
  }

  /**
   * TODO marketplace sell packages
   * total tx
   * total value
   */

  /**
   * TODO spend wallet
   * summon,limit break, hot wallet(user earn)
   * - tx
   * - total he
   * - total fee
   * issued hero:
   * - tx
   * - total fee
   */
  async update_spend_wallet() {
    await Promise.all(
      [
        "SUMMON",
        "LIMIT_BREAK",
        "HOTWALLET",
        "BUY_SLOT",
        "DEPOSIT",
        "CLAN_MAP",
        "EDIT_NAME",
        "PURCHASE_ITEM_DUNGEON",
        "REQUEST_HERO",
        "UNION_BLESSING",
        "SPEND_FEE",
      ].map((t) => {
        return (async () => {
          const [tx, total, fee] = await Promise.all([
            HotWalletTransfer.count({ where: { type: t } }),
            HotWalletTransfer.sum("amount", { where: { type: t } }),
            HotWalletTransfer.sum("tx_fee", { where: { type: t } }),
          ]);
          await Snapshot.bulkCreate([
            {
              key: `${t}_TX`,
              group: t === "HOTWALLET" ? null : "SPEND",
              value: tx,
            },
            {
              key: `${t}_TOTAL`,
              group: t === "HOTWALLET" ? null : "SPEND",
              value: total,
            },
            {
              key: `${t}_FEE`,
              group: t === "HOTWALLET" ? null : "SPEND",
              value: fee,
            },
          ]);
        })();
      }),
    );
  }
  async update_hero_issued_tx() {
    const hero: any = await connection.query(
      `select count(1) AS tx,sum(a.tx_fee) as fee
      from (select max(tx_fee) as tx_fee
      from "TransferHeros"
      where from_address = '${BURN_ADDRESS}' group by tx_hash) a`,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.bulkCreate([
      {
        key: snapshotKey.HERO_ISSUED_TX,
        value: hero[0].tx,
      },
      {
        key: snapshotKey.HERO_ISSUED_FEE,
        value: hero[0].fee,
      },
    ]);
  }
  //total user
  async update_total_user() {
    const user: any = await connection.query(
      `SELECT
      count(DISTINCT to_address) as total
      FROM "TransferHeros"
      where to_address != '${BURN_ADDRESS}'`,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.create({
      key: snapshotKey.TOTAL_USER,
      value: user[0].total,
    });
  }

  // holder
  async snapshot_holder() {
    const user: any = await connection.query(
      `select count(distinct owner) as total from "HeroV2s"  where not is_burned `,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.create({
      key: snapshotKey.TOTAL_HOLDER,
      value: user[0].total,
    });
  }

  //total hero issued and burn
  async update_total_hero() {
    const [issued, burned] = await Promise.all([
      TransferHero.count({
        where: {
          from_address: BURN_ADDRESS,
        },
      }),
      TransferHero.count({
        where: {
          to_address: BURN_ADDRESS,
        },
      }),
    ]);
    await Snapshot.bulkCreate([
      {
        key: snapshotKey.TOTAL_HERO_ISSUED,
        value: issued,
      },
      {
        key: snapshotKey.TOTAL_HERO_BURNED,
        value: burned,
      },
    ]);
  }

  //total package nft issued and burn
  async update_total_package_nft() {
    const [issued, burned] = await Promise.all([
      PackageNFT.count({
        where: {
          from_address: BURN_ADDRESS,
        },
      }),
      PackageNFT.count({
        where: {
          to_address: BURN_ADDRESS,
        },
      }),
    ]);
    await Snapshot.bulkCreate([
      {
        key: snapshotKey.PACKAGE_NFT_TOTAL_ISSUED,
        value: issued,
      },
      {
        key: snapshotKey.PACKAGE_NFT_TOTAL_BURNED,
        value: burned,
      },
    ]);
  }

  /**
   * TODO hero count
   * by hero
   * by class
   * by tier
   * by race
   */
  async update_count_hero() {
    const heros: any = await connection.query(
      `select  name, count(1) as heroes from "HeroV2s" where not is_burned group by name order by heroes;`,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.bulkCreate(
      heros.map((hero: any) => {
        return {
          key: hero.name,
          value: hero.heroes,
          group: snapshotKey.HERO,
        };
      }),
    );
  }
  async update_count_hero_by_class() {
    const heros = await connection.query(
      `select  class, count(1) as heroes from "HeroV2s" where not is_burned group by class order by heroes;`,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.bulkCreate(
      heros.map((hero: any) => {
        return {
          key: hero.class,
          value: hero.heroes,
          group: snapshotKey.HERO_CLASS,
        };
      }),
    );
  }
  async update_count_hero_by_race() {
    const heros = await connection.query(
      `select  race, count(1) as heroes from "HeroV2s" where not is_burned group by race order by heroes;`,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.bulkCreate(
      heros.map((hero: any) => {
        return {
          key: hero.race,
          value: hero.heroes,
          group: snapshotKey.HERO_RACE,
        };
      }),
    );
  }
  async update_count_hero_by_tier() {
    const heros = await connection.query(
      `select  tier, count(1) as heroes from "HeroV2s" where not is_burned group by tier order by heroes;`,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.bulkCreate(
      heros.map((hero: any) => {
        return {
          key: hero.tier,
          group: snapshotKey.HERO_TIER,
          value: hero.heroes,
        };
      }),
    );
  }

  async update_marketplace_listing() {
    const listing = (
      await axios.get(
        `${config.MARKETPLACE_API}/market/api/market-data/statistic`,
      )
    ).data;
    await Snapshot.bulkCreate([
      {
        key: snapshotKey.MARKETPLACE_LISTING_ITEMS,
        value: listing.totalSaleItems,
      },
      {
        key: snapshotKey.MARKETPLACE_LISTING_VOLUME,
        value: listing.totalVolume,
      },
      {
        key: snapshotKey.MARKETPLACE_TOTAL_USER,
        value: listing.totalUsers,
      },
    ]);
  }

  async playfab() {
    const client = axios.create({ baseURL: config.PLAYFAB, timeout: 300000 });
    logger.info(`playfab begin snapshot`);
    const totalUser: any = (await client.get("/playfab/count_total_user")).data;
    await Snapshot.create({
      key: snapshotKey.PLAYFAB_TOTAL_USER,
      value: totalUser.total_user,
    });
    const dailyActive: any = (
      await client.get("/playfab/count_daily_active_user")
    ).data;
    await Snapshot.create({
      key: snapshotKey.PLAYFAB_DAILY_ACTIVE,
      value: dailyActive.daily_active_user,
    });
    const heIngame: any = (await client.get("/playfab/get_he_ingame")).data;
    await Snapshot.create({
      key: snapshotKey.PLAYFAB_HE_INGAME,
      value: heIngame.he_ingame,
    });
    logger.info(`playfab end snapshot`);
  }

  async snapshot_hot_wallet() {
    const spendFee = await connection.query(
      `SELECT
        'USER_SPEND' as "key",
        sum(amount) as "value"
      FROM "HotWalletTransfers" where type in ('SUMMON','LIMIT_BREAK','SPEND_FEE')
      group by 1`,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.bulkCreate(spendFee);
    const hotWallet = await connection.query(
      `SELECT
        'HOTWALLET' as "key",
        sum(amount) as "value"
      FROM "HotWalletTransfers" where type = 'HOTWALLET'
      group by 1`,
      { type: QueryTypes.SELECT },
    );
    await Snapshot.bulkCreate(hotWallet);
  }

  async snapshotSpendEarnInGame() {
    const now = new Date();
    const fromDateString = `${now.getFullYear()}${now.getMonth() + 1}${
      now.getDate() - 1
    }`;
    const toDateString = `${now.getFullYear()}${
      now.getMonth() + 1
    }${now.getDate()}`;
    // const spend = await IngameService.heSpend(fromDateString, toDateString);
    // const earn = await IngameService.heEarn(fromDateString, toDateString);
    const spend = await IngameService.heSpendNew(fromDateString, toDateString);
    const earn = await IngameService.heEarnNew(fromDateString, toDateString);
    for (let s of spend.Rows) {
      await updateOrCreate(
        Snapshot,
        {
          group: snapshotKey.SPEND_HE_INGAME,
          key: s[1],
          createdAt: new Date(s[0]),
        },
        {
          group: snapshotKey.SPEND_HE_INGAME,
          key: s[1],
          createdAt: new Date(s[0]),
          value: Math.abs(s[2]),
        },
      );
    }
    for (let s of earn.Rows) {
      await updateOrCreate(
        Snapshot,
        {
          group: snapshotKey.EARN_HE_INGAME,
          key: s[1],
          createdAt: new Date(s[0]),
        },
        {
          group: snapshotKey.EARN_HE_INGAME,
          key: s[1],
          createdAt: new Date(s[0]),
          value: s[2],
        },
      );
    }
  }

  async snapshot() {
    await Promise.all([
      // this.update_count_hero(),
      // this.update_count_hero_by_class(),
      // this.update_count_hero_by_race(),
      // this.update_count_hero_by_tier(),
      // this.update_hero_issued_tx(),
      // this.update_marketplace_matching_tx(),
      // this.update_spend_wallet(),
      // this.update_total_package_nft(),
      this.update_total_hero(),
      this.update_total_user(),
      this.snapshot_hot_wallet(),
      this.snapshot_holder(),
    ]);
    try {
      await this.update_marketplace_listing();
    } catch (error) {
      logger.error("update_marketplace_listing error " + error);
      logger.error(error);
    }
    try {
      await this.playfab();
    } catch (error) {
      logger.error("playfab error " + error);
      logger.error(error);
    }
    try {
      await this.snapshotSpendEarnInGame();
    } catch (error) {
      logger.error("snapshotSpendEarnInGame error " + error);
      logger.error(error);
    }
  }
}
export default SnapshotService;
