import TransferHero from "../model/TransferHero";

export class TransferHeroService {
  async getLatestBlock(): Promise<number> {
    return await TransferHero.max("block_number");
  }
}
