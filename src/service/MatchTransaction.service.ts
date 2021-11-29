import MatchTransaction from "../model/MatchTransaction";

class MatchTransactionService {
  async getLatestBlock(): Promise<number> {
    return await MatchTransaction.max("block_number");
  }
}

export default MatchTransactionService;
