import HeroCheck from "../model/HeroCheck";
class HeroCheckService {
  async getLatestBlock(): Promise<number> {
    return await HeroCheck.max("block_number");
  }
}

export default HeroCheckService;
