import { QueryTypes } from "sequelize";
import { BURN_ADDRESS } from "../constant";
import connection from "../DBConnect";
import TransferHero from "../model/TransferHero";

export class TransferHeroService {
  async getLatestBlock(): Promise<number> {
    return await TransferHero.max("block_number");
  }

  async getHeroSummon(
    address: string,
    tierBasic: string,
  ): Promise<IHeroSummonShard[]> {
    const rs: IHeroSummonShard[] = await connection.query(
      `select b.token_id,a.tx_hash,a.create_time,b.tier_basic from 
        (select tx_hash,create_time from "TransferHeros"  
        where from_address= $burned
        and to_address = $address
        and create_time  BETWEEN NOW() - INTERVAL '24 HOURS' AND NOW()
        ) a,
        "HeroV2s" b where  a.tx_hash = b.tx_hash and b.type_issued = 'Shard' and b.tier_basic = $tierBasic`,
      {
        bind: { burned: BURN_ADDRESS, address: address, tierBasic: tierBasic },
        type: QueryTypes.SELECT,
      },
    );
    return rs;
  }
}

export interface IHeroSummonShard {
  token_id: string;
  tx_hash: string;
  create_time: Date;
  tier_basic: string;
}
