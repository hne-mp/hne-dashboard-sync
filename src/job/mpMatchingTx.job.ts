import { BaseJob } from "./base.job";
import { EventData } from "web3-eth-contract";
import { logger } from "../utils/logger";
import {
  contract_market,
  contract_transfer,
  getWeb3,
} from "../contract/contract";
import { threadPool } from "../utils/parallel";
import MatchTransaction from "../model/MatchTransaction";
import { SequelizeUniqueConstraintError, TOPICS } from "../constant";
import SystemConfigService from "../service/SystemConfig.service";
import config from "../config";
import { send_message } from "../service/Telegram.Bot";

export class MpMatchingTxJob extends BaseJob {
  process = async (fromBlock: number, toBlock: number) => {
    logger.debug(`${this.name} begin sync block ${fromBlock} - ${toBlock}`);
    let list_transfer = await contract_market().getPastEvents(
      "MatchTransaction",
      {
        fromBlock,
        toBlock,
        topics: [TOPICS.MATCH_TX_V2],
      },
    );
    this.setLatestBlock(fromBlock);
    const max = config.MATCH_TX_PROCESS;
    for (let i = 0; i < list_transfer.length; i += max) {
      const processList = list_transfer.slice(i, i + max);
      await threadPool(processList, this.processTx, config.MATCH_TX_PROCESS);
      this.setLatestBlock(processList[processList.length - 1].blockNumber);
    }
    if (list_transfer.length > 0) {
      this.setLatestBlock(
        list_transfer[list_transfer.length - 1].blockNumber + 1,
      );
    }
    logger.debug(
      `${this.name} end sync block ${fromBlock} - ${this.latestBlock()}`,
    );
  };
  processTx = async (transfer: EventData) => {
    const web3 = getWeb3();
    const return_value = transfer.returnValues;
    const nftContract = contract_transfer();
    const block = await web3.eth.getBlock(transfer.blockNumber);
    const heroData =
      return_value.contractAddress.toLowerCase() ===
      config.CONTRACT.HERO_NFT_ADDRESS.toLowerCase()
        ? await nftContract.methods.heroesNumber(return_value.tokenId).call()
        : {};
    const price = web3.utils.fromWei(return_value.price);
    if (Number(price) < 10) {
      await send_message(`
        [Marketplace] matching transaction - detect low price ( < 10 HE).
         TokenID: ${return_value.tokenId},
         Price: ${price}HE,
        [View on bscscan](${
          "https://bscscan.com/tx/" + transfer.transactionHash
        })
      `);
    }
    try {
      let obj = {
        token_id: return_value.tokenId,
        tx_hash: transfer.transactionHash,
        create_time: Number(block.timestamp) * 10 ** 3,
        block_number: transfer.blockNumber,
        price: price,
        payment_token: return_value.paymentToken,
        seller: return_value.seller,
        buyer: return_value.buyer,
        market_fee: web3.utils.fromWei(return_value.feeInWei),
        address: return_value.contractAddress,
        hero_number: heroData?.heroesNumber,
        hero_name: heroData?.name,
        hero_race: heroData?.race,
        hero_tier: heroData?.tier,
      };
      await MatchTransaction.create(obj);
    } catch (error) {
      if (error.name !== SequelizeUniqueConstraintError) {
        throw error;
      }
    }
  };
}
