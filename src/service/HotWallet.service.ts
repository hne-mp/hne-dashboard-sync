import config from "../config";
import { getWeb3 } from "../contract/contract";
import { contract_he } from "../contract/contract";
import HotWalletTransfer from "../model/HotWalletTransfer";

export class HotWalletTransferService {
  async getLatestBlock(): Promise<number> {
    return await HotWalletTransfer.max("block_number");
  }
}

export async function hotWalletBalance() {
  const web3 = getWeb3();
  const [balanceHE, balanceBNB] = await Promise.all([
    contract_he().methods.balanceOf(config.ADDRESS.HOT_WALLET_ADDRESS).call(),
    web3.eth.getBalance(config.ADDRESS.HOT_WALLET_ADDRESS),
  ]);

  return {
    balanceHE: web3.utils.fromWei(balanceHE),
    balanceBNB: web3.utils.fromWei(balanceBNB),
  };
}
